/**
 * Threshold Reliability Calculator
 *
 * Evaluates how reliably a deck meets elemental threshold requirements
 * by a given turn using hypergeometric (single-element, binary pips) and
 * Monte Carlo pip-sum (multi-pip or multi-element) probability calculations.
 *
 * Method selection rule:
 *   Hypergeometric — when every site has 0 or 1 pip for the evaluated element
 *     (binary success/fail per draw).
 *   Monte Carlo — when any site contributes 2+ pips for a required element,
 *     or when the goal spans multiple elements.
 */
import { CardType, Element } from './enums';

const ELEMENTS = [Element.Fire, Element.Water, Element.Earth, Element.Air];

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------
const MAX_CACHE = 200;
const cache = new Map();

function cacheKey(atlas, nSeen, requirement) {
  const sc = ELEMENTS.map((e) => atlas.sourceCounts[e]).join(',');
  const rq = ELEMENTS.map((e) => requirement[e] || 0).join(',');
  return `${atlas.N}:${sc}|${nSeen}|${rq}`;
}

export function clearCache() {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/** Log-space binomial coefficient ln(C(n,k)) */
function logNcK(n, k) {
  if (k < 0 || k > n) return -Infinity;
  if (k === 0 || k === n) return 0;
  if (k > n - k) k = n - k;
  let sum = 0;
  for (let i = 0; i < k; i++) {
    sum += Math.log(n - i) - Math.log(i + 1);
  }
  return sum;
}

/**
 * Hypergeometric P(X >= r) for a single element.
 * N = population size, K = successes in population,
 * n = draws, r = required successes.
 */
function hypergeometric(N, K, n, r) {
  if (r <= 0) return 1.0;
  if (K < r || n < r) return 0.0;
  n = Math.min(n, N);
  let prob = 0;
  const upper = Math.min(K, n);
  for (let i = r; i <= upper; i++) {
    prob += Math.exp(logNcK(K, i) + logNcK(N - K, n - i) - logNcK(N, n));
  }
  return Math.max(0, Math.min(1, prob));
}

/**
 * Monte Carlo simulation for multi-element threshold requirements.
 * Uses partial Fisher-Yates shuffle with restoration for zero-allocation per trial.
 */
function monteCarlo(atlas, nSeen, requirement, trials = 50000) {
  const N = atlas.N;
  const n = Math.min(nSeen, N);
  if (n <= 0) return { probability: 0, ciLow: 0, ciHigh: 0 };

  // Pre-extract per-element pip arrays for fast access
  const activeElements = ELEMENTS.filter((e) => (requirement[e] || 0) > 0);
  const pipArrays = {};
  for (const e of activeElements) {
    pipArrays[e] = atlas.sites.map((s) => s.pips[e]);
  }
  const reqs = activeElements.map((e) => requirement[e]);

  // Index array for shuffling
  const indices = new Uint16Array(N);
  for (let i = 0; i < N; i++) indices[i] = i;

  let successes = 0;

  for (let t = 0; t < trials; t++) {
    // Partial Fisher-Yates: shuffle first n elements
    const swapped = [];
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(Math.random() * (N - i));
      if (i !== j) {
        swapped.push([i, j, indices[i], indices[j]]);
        const tmp = indices[i];
        indices[i] = indices[j];
        indices[j] = tmp;
      }
    }

    // Check requirement
    let pass = true;
    for (let ei = 0; ei < activeElements.length; ei++) {
      const pips = pipArrays[activeElements[ei]];
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += pips[indices[i]];
      }
      if (sum < reqs[ei]) {
        pass = false;
        break;
      }
    }
    if (pass) successes++;

    // Restore swapped positions
    for (let s = swapped.length - 1; s >= 0; s--) {
      const [i, j] = swapped[s];
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
  }

  const p = successes / trials;
  const margin = 1.96 * Math.sqrt((p * (1 - p)) / trials);
  return {
    probability: Math.max(0, Math.min(1, p)),
    ciLow: Math.max(0, p - margin),
    ciHigh: Math.min(1, p + margin),
  };
}

// ---------------------------------------------------------------------------
// Method selection
// ---------------------------------------------------------------------------

/** True if every site contributes 0 or 1 pip for this element (binary). */
function isBinaryAtlasForElement(atlas, element) {
  return atlas.sites.every((s) => s.pips[element] <= 1);
}

/** Determine whether to use hypergeometric or montecarlo for a goal. */
function chooseMethod(goal, atlas) {
  if (goal.isMultiElement) return 'montecarlo';
  const element = ELEMENTS.find((e) => goal.requirement[e] > 0);
  if (!element) return 'montecarlo';
  return isBinaryAtlasForElement(atlas, element) ? 'hypergeometric' : 'montecarlo';
}

// ---------------------------------------------------------------------------
// Atlas
// ---------------------------------------------------------------------------

/**
 * Build an atlas from formatted cards (expanded by quantity, main deck only).
 * Uses actual threshold values from Site cards as pip counts — for Sites,
 * fireThreshold etc. represent the pips the site provides.
 */
export function buildAtlas(cards) {
  const sites = [];
  const sourceCounts = { [Element.Fire]: 0, [Element.Water]: 0, [Element.Earth]: 0, [Element.Air]: 0 };

  for (const card of cards) {
    if (card.type !== CardType.Site) continue;
    const pips = {
      [Element.Fire]: card.fireThreshold || 0,
      [Element.Water]: card.waterThreshold || 0,
      [Element.Earth]: card.earthThreshold || 0,
      [Element.Air]: card.airThreshold || 0,
    };
    for (let i = 0; i < card.quantity; i++) {
      sites.push({ name: card.name, pips });
      for (const e of ELEMENTS) {
        sourceCounts[e] += pips[e];
      }
    }
  }

  return { sites, N: sites.length, sourceCounts };
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

/**
 * Auto-derive threshold goals from non-Site cards.
 * Groups cards by their exact requirement vector.
 */
export function deriveGoals(cards, atlas) {
  const goalMap = new Map();

  for (const card of cards) {
    if (card.type === CardType.Site) continue;

    const req = {
      [Element.Fire]: card.fireThreshold || 0,
      [Element.Water]: card.waterThreshold || 0,
      [Element.Earth]: card.earthThreshold || 0,
      [Element.Air]: card.airThreshold || 0,
    };

    // Skip cards with no threshold requirements
    const total = ELEMENTS.reduce((s, e) => s + req[e], 0);
    if (total === 0) continue;

    const id = ELEMENTS.map((e) => req[e]).join('-');

    if (!goalMap.has(id)) {
      const activeElementCount = ELEMENTS.filter((e) => req[e] > 0).length;
      goalMap.set(id, {
        id,
        requirement: req,
        cardNames: [],
        lowestCost: Infinity,
        isMultiElement: activeElementCount > 1,
        activeElementCount,
      });
    }

    const goal = goalMap.get(id);
    goal.cardNames.push(card.name);
    const cost = card.cost !== null && card.cost !== undefined ? card.cost : 3;
    if (cost < goal.lowestCost) goal.lowestCost = cost;
  }

  return Array.from(goalMap.values()).map((g) => ({
    id: g.id,
    requirement: g.requirement,
    cardNames: [...new Set(g.cardNames)],
    targetTurn: Math.max(1, Math.min(10, g.lowestCost)),
    isMultiElement: g.isMultiElement,
    activeElementCount: g.activeElementCount,
  }));
}

/**
 * Default number of sites seen by a given turn.
 * In Sorcery you draw 3 sites on turn 1, then 1 more each subsequent turn.
 * Turn 1 → 3, Turn 2 → 4, Turn 3 → 5, etc. Minimum 3 (opening draw).
 */
export function defaultNSeen(atlas, turn) {
  return Math.min(Math.max(turn + 2, 3), atlas.N);
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a single goal's probability.
 */
export function evaluateGoal(goal, atlas, nSeen) {
  const n = Math.min(nSeen, atlas.N);
  const key = cacheKey(atlas, n, goal.requirement);

  if (cache.has(key)) return cache.get(key);

  let result;

  const method = chooseMethod(goal, atlas);

  if (method === 'montecarlo') {
    // Monte Carlo: pip-sum model — handles multi-pip and multi-element
    const mc = monteCarlo(atlas, n, goal.requirement);
    result = {
      goal,
      probability: mc.probability,
      passes: false, // set by caller
      method: 'montecarlo',
      ciLow: mc.ciLow,
      ciHigh: mc.ciHigh,
      mathDetails: {
        N: atlas.N,
        n,
        requirement: { ...goal.requirement },
        trials: 50000,
      },
      recommendation: null,
    };
  } else {
    // Hypergeometric: binary model — K = count of sites with >= 1 pip
    const element = ELEMENTS.find((e) => goal.requirement[e] > 0);
    const K = atlas.sites.filter((s) => s.pips[element] >= 1).length;
    const r = goal.requirement[element];
    const prob = hypergeometric(atlas.N, K, n, r);
    result = {
      goal,
      probability: prob,
      passes: false,
      method: 'hypergeometric',
      ciLow: null,
      ciHigh: null,
      mathDetails: {
        N: atlas.N,
        K,
        n,
        r,
        element,
      },
      recommendation: null,
    };
  }

  // Evict oldest if cache full
  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, result);

  return result;
}

/**
 * Evaluate all goals, attach recommendations for failures.
 * @param {number|null} turnOverride - If set, all goals use this turn for nSeen calculation.
 *   null = each goal uses its own targetTurn.
 */
export function evaluateAllGoals(goals, atlas, turnOverride, target = 0.9) {
  return goals.map((goal) => {
    const turn = turnOverride ?? goal.targetTurn;
    const nSeen = defaultNSeen(atlas, turn);
    const result = { ...evaluateGoal(goal, atlas, nSeen) };
    result.passes = result.probability >= target;

    if (!result.passes) {
      result.recommendation = recommend(goal, atlas, nSeen, target);
    }

    return result;
  });
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/** Build a virtual atlas with hypothetical added sites. */
function buildModifiedAtlas(atlas, adds) {
  const newSites = [...atlas.sites];
  const newSourceCounts = { ...atlas.sourceCounts };

  for (const e of ELEMENTS) {
    const count = adds[e] || 0;
    for (let i = 0; i < count; i++) {
      const pips = { [Element.Fire]: 0, [Element.Water]: 0, [Element.Earth]: 0, [Element.Air]: 0 };
      pips[e] = 1;
      newSites.push({ name: `+${e} source`, pips });
      newSourceCounts[e] += 1;
    }
  }

  return { sites: newSites, N: newSites.length, sourceCounts: newSourceCounts };
}

/** Find the element with most sources that isn't the needed element. */
function findCutCandidate(atlas, neededElements) {
  let best = null;
  let bestCount = 0;

  for (const e of ELEMENTS) {
    if (neededElements.has(e)) continue;
    if (atlas.sourceCounts[e] > bestCount) {
      bestCount = atlas.sourceCounts[e];
      best = e;
    }
  }

  return best && bestCount > 0 ? { element: best, count: 1 } : null;
}

/**
 * Generate a recommendation for a failing goal.
 */
export function recommend(goal, atlas, nSeen, target) {
  const n = Math.min(nSeen, atlas.N);
  const neededElements = new Set(ELEMENTS.filter((e) => goal.requirement[e] > 0));

  if (goal.isMultiElement) {
    return recommendMultiElement(goal, atlas, n, target, neededElements);
  }

  // Single-element: find minimum adds needed
  const element = ELEMENTS.find((e) => goal.requirement[e] > 0);
  const r = goal.requirement[element];
  const maxAdds = 20;

  for (let adds = 1; adds <= maxAdds; adds++) {
    const modAtlas = buildModifiedAtlas(atlas, { [element]: adds });
    const newn = Math.min(n + adds, modAtlas.N);
    // Use same method selection as evaluateGoal — if original atlas had
    // multi-pip sites, the modified atlas still does, so use Monte Carlo
    const useMC = !isBinaryAtlasForElement(modAtlas, element);
    let prob;
    if (useMC) {
      prob = monteCarlo(modAtlas, newn, goal.requirement, 20000).probability;
    } else {
      const K = modAtlas.sites.filter((s) => s.pips[element] >= 1).length;
      prob = hypergeometric(modAtlas.N, K, newn, r);
    }
    if (prob >= target) {
      return {
        addSources: { [Element.Fire]: 0, [Element.Water]: 0, [Element.Earth]: 0, [Element.Air]: 0, [element]: adds },
        totalAdds: adds,
        cutSuggestion: findCutCandidate(atlas, neededElements),
        newProbability: prob,
      };
    }
  }

  // Cap reached — return best we can do
  const modAtlas = buildModifiedAtlas(atlas, { [element]: maxAdds });
  const newn = Math.min(n + maxAdds, modAtlas.N);
  const useMC = !isBinaryAtlasForElement(modAtlas, element);
  const prob = useMC
    ? monteCarlo(modAtlas, newn, goal.requirement, 20000).probability
    : hypergeometric(modAtlas.N, modAtlas.sites.filter((s) => s.pips[element] >= 1).length, newn, r);
  return {
    addSources: { [Element.Fire]: 0, [Element.Water]: 0, [Element.Earth]: 0, [Element.Air]: 0, [element]: maxAdds },
    totalAdds: maxAdds,
    cutSuggestion: findCutCandidate(atlas, neededElements),
    newProbability: prob,
  };
}

/** Greedy recommendation for multi-element goals. */
function recommendMultiElement(goal, atlas, nSeen, target, neededElements) {
  const adds = { [Element.Fire]: 0, [Element.Water]: 0, [Element.Earth]: 0, [Element.Air]: 0 };
  const maxTotal = 10;
  let totalAdds = 0;

  while (totalAdds < maxTotal) {
    // Find element with highest deficit ratio
    let worstElement = null;
    let worstRatio = Infinity;

    for (const e of ELEMENTS) {
      const req = goal.requirement[e] || 0;
      if (req <= 0) continue;
      const currentSources = atlas.sourceCounts[e] + adds[e];
      const ratio = currentSources / req;
      if (ratio < worstRatio) {
        worstRatio = ratio;
        worstElement = e;
      }
    }

    if (!worstElement) break;
    adds[worstElement] += 1;
    totalAdds += 1;

    // Check if target met with reduced trials for speed
    const modAtlas = buildModifiedAtlas(atlas, adds);
    const newn = Math.min(nSeen + totalAdds, modAtlas.N);
    const mc = monteCarlo(modAtlas, newn, goal.requirement, 20000);
    if (mc.probability >= target) {
      return {
        addSources: { ...adds },
        totalAdds,
        cutSuggestion: findCutCandidate(atlas, neededElements),
        newProbability: mc.probability,
      };
    }
  }

  // Cap reached
  const modAtlas = buildModifiedAtlas(atlas, adds);
  const mc = monteCarlo(modAtlas, Math.min(nSeen + totalAdds, modAtlas.N), goal.requirement, 20000);
  return {
    addSources: { ...adds },
    totalAdds,
    cutSuggestion: findCutCandidate(atlas, neededElements),
    newProbability: mc.probability,
  };
}
