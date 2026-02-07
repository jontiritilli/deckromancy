/**
 * Tests for threshold-calculator.js
 *
 * Validates hypergeometric probabilities against reference tables from
 * ranges/aggro.jpg, ranges/midrange.jpg, and ranges/pathfinder.jpg.
 *
 * All reference tables assume N=30 total sites in the atlas.
 * Rows = number of sources (K) providing a specific element.
 * Columns = threshold requirement (r) grouped by sites seen (n).
 *
 * Table turn → sites-seen mappings:
 *   Aggro:      T1/5, T2-4/6, T5/7, T6-7/8
 *   Midrange:   T1/5, T2/6, T3/7, T4/7, T5-6/8, T7-8/9, T9/10
 *   Pathfinder: T1/1, T2/2, T3/3, T4/4, T5/5, T6-7/6, T8/7, T9/8, T10/9
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildAtlas,
  deriveGoals,
  defaultNSeen,
  evaluateGoal,
  evaluateAllGoals,
  clearCache,
} from '../threshold-calculator';

// ---------------------------------------------------------------------------
// Helpers to build test fixtures
// ---------------------------------------------------------------------------

/** Create a formatted Site card for atlas building */
function makeSite(name, elements, thresholds = {}, quantity = 1) {
  return {
    name,
    type: 'Site',
    cost: null,
    elements,
    quantity,
    fireThreshold: thresholds.fire ?? 0,
    waterThreshold: thresholds.water ?? 0,
    earthThreshold: thresholds.earth ?? 0,
    airThreshold: thresholds.air ?? 0,
    keywords: [],
  };
}

/** Create a formatted non-Site card */
function makeSpell(name, cost, thresholds = {}, quantity = 1) {
  return {
    name,
    type: 'Minion',
    cost,
    elements: Object.keys(thresholds).filter((e) => thresholds[e] > 0).map((e) => e.charAt(0).toUpperCase() + e.slice(1)),
    quantity,
    fireThreshold: thresholds.fire ?? 0,
    waterThreshold: thresholds.water ?? 0,
    earthThreshold: thresholds.earth ?? 0,
    airThreshold: thresholds.air ?? 0,
    keywords: [],
  };
}

/**
 * Build a 30-site atlas with a specific number of single-element sources.
 * Remaining sites are "blank" (no element pips).
 */
function buildTestAtlas(sources) {
  const cards = [];
  const elements = ['fire', 'water', 'earth', 'air'];

  for (const el of elements) {
    const count = sources[el] || 0;
    if (count > 0) {
      cards.push(makeSite(`${el} site`, [el.charAt(0).toUpperCase() + el.slice(1)], { [el]: 1 }, count));
    }
  }

  // Fill remaining with blank sites (no pips)
  const totalSources = Object.values(sources).reduce((a, b) => a + b, 0);
  const remaining = 30 - totalSources;
  if (remaining > 0) {
    cards.push(makeSite('Blank Site', [], {}, remaining));
  }

  return buildAtlas(cards);
}

// ---------------------------------------------------------------------------
// Reference table data points
// ---------------------------------------------------------------------------

/**
 * Each entry: [K (sources), n (sites seen), r (requirement), expected probability %]
 * Extracted from the three reference images.
 * All assume N = 30.
 */

// From Aggro table (ranges/aggro.jpg)
const AGGRO_REFERENCE = [
  // Row 1 (K=1)
  [1, 5, 1, 16.7],
  [1, 6, 1, 20.0],
  [1, 7, 1, 23.3],
  [1, 8, 1, 26.7],
  // Row 2 (K=2)
  [2, 5, 1, 31.0],
  [2, 6, 1, 36.6],
  [2, 6, 2, 3.5],
  [2, 8, 1, 46.9],
  [2, 8, 2, 6.4],
  // Row 3 (K=3)
  [3, 5, 1, 43.3],
  [3, 6, 1, 50.1],
  [3, 6, 2, 9.4],
  [3, 7, 1, 56.4],
  [3, 7, 2, 12.8],
  [3, 8, 1, 62.1],
  [3, 8, 2, 16.6],
  // Row 5 (K=5)
  [5, 5, 1, 62.7],
  [5, 6, 1, 70.2],
  [5, 6, 2, 25.4],
  [5, 6, 3, 4.1],
  [5, 7, 1, 76.4],
  [5, 7, 2, 32.9],
  [5, 7, 3, 6.8],
  [5, 8, 1, 81.5],
  [5, 8, 2, 40.5],
  [5, 8, 3, 10.2],
  [5, 8, 4, 1.1],
  // Row 10 (K=10)
  [10, 5, 1, 89.1],
  [10, 8, 1, 97.8],
  [10, 8, 2, 84.6],
  // Row 15 (K=15)
  [15, 5, 1, 97.9],
  [15, 6, 1, 99.2],
  [15, 7, 1, 99.7],
  [15, 8, 1, 99.8],
];

// From Pathfinder table (ranges/pathfinder.jpg) — simplest turn/n mapping
const PATHFINDER_REFERENCE = [
  // Row 1 (K=1)
  [1, 1, 1, 3.3],
  [1, 2, 1, 6.7],
  [1, 3, 1, 10.0],
  [1, 4, 1, 13.3],
  [1, 5, 1, 16.7],
  // Row 3 (K=3)
  [3, 1, 1, 10.0],
  [3, 2, 1, 19.3],
  [3, 3, 1, 28.0],
  // Row 5 (K=5)
  [5, 1, 1, 16.7],
  [5, 5, 1, 62.7],
  // Row 10 (K=10)
  [10, 1, 1, 33.3],
  [10, 5, 1, 89.1],
  // Row 15 (K=15)
  [15, 1, 1, 50.0],
  [15, 5, 1, 97.9],
  // Row 20 (K=20)
  [20, 1, 1, 66.7],
  // Row 30 (K=30)
  [30, 1, 1, 100.0],
  [30, 5, 1, 100.0],
  [30, 5, 2, 100.0],
];

// From Midrange table (ranges/midrange.jpg)
const MIDRANGE_REFERENCE = [
  // Row 1 (K=1)
  [1, 5, 1, 16.7],
  [1, 6, 1, 20.0],
  [1, 7, 1, 23.3],
  [1, 9, 1, 30.0],
  [1, 10, 1, 33.3],
  // Row 5 (K=5)
  [5, 5, 1, 62.7],
  [5, 7, 1, 76.4],
  // Row 10 (K=10)
  [10, 5, 1, 89.1],
  [10, 7, 1, 96.2],
  [10, 9, 1, 98.8],
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('threshold-calculator', () => {
  beforeEach(() => clearCache());

  describe('hypergeometric accuracy vs Aggro reference table (N=30)', () => {
    it.each(AGGRO_REFERENCE)(
      'K=%i sources, n=%i seen, r=%i required → %f%%',
      (K, n, r, expectedPct) => {
        const atlas = buildTestAtlas({ fire: K });
        const goal = {
          id: 'test',
          requirement: { fire: r, water: 0, earth: 0, air: 0 },
          cardNames: ['Test Card'],
          targetTurn: n,
          isMultiElement: false,
          activeElementCount: 1,
        };
        const result = evaluateGoal(goal, atlas, n);
        const actualPct = Math.round(result.probability * 1000) / 10;
        expect(actualPct).toBeCloseTo(expectedPct, 0.5);
      },
    );
  });

  describe('hypergeometric accuracy vs Pathfinder reference table (N=30)', () => {
    it.each(PATHFINDER_REFERENCE)(
      'K=%i sources, n=%i seen, r=%i required → %f%%',
      (K, n, r, expectedPct) => {
        const atlas = buildTestAtlas({ fire: K });
        const goal = {
          id: 'test',
          requirement: { fire: r, water: 0, earth: 0, air: 0 },
          cardNames: ['Test Card'],
          targetTurn: n,
          isMultiElement: false,
          activeElementCount: 1,
        };
        const result = evaluateGoal(goal, atlas, n);
        const actualPct = Math.round(result.probability * 1000) / 10;
        expect(actualPct).toBeCloseTo(expectedPct, 0.5);
      },
    );
  });

  describe('hypergeometric accuracy vs Midrange reference table (N=30)', () => {
    it.each(MIDRANGE_REFERENCE)(
      'K=%i sources, n=%i seen, r=%i required → %f%%',
      (K, n, r, expectedPct) => {
        const atlas = buildTestAtlas({ fire: K });
        const goal = {
          id: 'test',
          requirement: { fire: r, water: 0, earth: 0, air: 0 },
          cardNames: ['Test Card'],
          targetTurn: n,
          isMultiElement: false,
          activeElementCount: 1,
        };
        const result = evaluateGoal(goal, atlas, n);
        const actualPct = Math.round(result.probability * 1000) / 10;
        expect(actualPct).toBeCloseTo(expectedPct, 0.5);
      },
    );
  });

  describe('edge cases', () => {
    it('r=1 with all sources matching returns 1.0', () => {
      const atlas = buildTestAtlas({ fire: 30 });
      const goal = {
        id: 'test',
        requirement: { fire: 1, water: 0, earth: 0, air: 0 },
        cardNames: ['Test'],
        targetTurn: 1,
        isMultiElement: false,
        activeElementCount: 1,
      };
      const result = evaluateGoal(goal, atlas, 5);
      expect(result.probability).toBe(1.0);
    });

    it('K < r returns 0.0 (impossible requirement)', () => {
      const atlas = buildTestAtlas({ fire: 1 });
      const goal = {
        id: 'test',
        requirement: { fire: 3, water: 0, earth: 0, air: 0 },
        cardNames: ['Test'],
        targetTurn: 3,
        isMultiElement: false,
        activeElementCount: 1,
      };
      const result = evaluateGoal(goal, atlas, 5);
      expect(result.probability).toBe(0.0);
    });

    it('K=N returns 1.0 (all sites match)', () => {
      const atlas = buildTestAtlas({ fire: 30 });
      const goal = {
        id: 'test',
        requirement: { fire: 3, water: 0, earth: 0, air: 0 },
        cardNames: ['Test'],
        targetTurn: 3,
        isMultiElement: false,
        activeElementCount: 1,
      };
      const result = evaluateGoal(goal, atlas, 5);
      expect(result.probability).toBe(1.0);
    });

    it('empty atlas returns 0.0 for all goals', () => {
      const atlas = buildAtlas([]);
      expect(atlas.N).toBe(0);
      const goal = {
        id: 'test',
        requirement: { fire: 1, water: 0, earth: 0, air: 0 },
        cardNames: ['Test'],
        targetTurn: 1,
        isMultiElement: false,
        activeElementCount: 1,
      };
      const result = evaluateGoal(goal, atlas, 0);
      expect(result.probability).toBe(0.0);
    });
  });

  describe('buildAtlas', () => {
    it('reads actual pip counts from site threshold values', () => {
      const cards = [
        makeSite('Fire Site', ['Fire'], { fire: 1 }, 3),
        makeSite('Dual Site', ['Fire', 'Earth'], { fire: 1, earth: 1 }, 2),
        makeSite('Big Fire', ['Fire'], { fire: 2 }, 1),
      ];
      const atlas = buildAtlas(cards);
      expect(atlas.N).toBe(6);
      expect(atlas.sourceCounts.fire).toBe(7);  // 3*1 + 2*1 + 1*2
      expect(atlas.sourceCounts.earth).toBe(2); // 2*1
      expect(atlas.sourceCounts.water).toBe(0);
      expect(atlas.sourceCounts.air).toBe(0);
    });

    it('ignores non-Site cards', () => {
      const cards = [
        makeSite('Fire Site', ['Fire'], { fire: 1 }, 5),
        makeSpell('Fireball', 3, { fire: 2 }, 4),
      ];
      const atlas = buildAtlas(cards);
      expect(atlas.N).toBe(5);
    });
  });

  describe('deriveGoals', () => {
    it('groups cards by requirement vector', () => {
      const cards = [
        makeSpell('Fireball', 3, { fire: 2 }),
        makeSpell('Flame Burst', 4, { fire: 2 }),
        makeSpell('Tidal Wave', 3, { water: 1 }),
      ];
      const atlas = buildTestAtlas({ fire: 10, water: 5 });
      const goals = deriveGoals(cards, atlas);

      expect(goals).toHaveLength(2);

      const fireGoal = goals.find((g) => g.requirement.fire === 2);
      expect(fireGoal.cardNames).toContain('Fireball');
      expect(fireGoal.cardNames).toContain('Flame Burst');
      expect(fireGoal.targetTurn).toBe(3); // lowest cost in group
    });

    it('skips cards with no thresholds', () => {
      const cards = [
        makeSpell('Generic', 2, {}),
        makeSpell('Fireball', 3, { fire: 1 }),
      ];
      const atlas = buildTestAtlas({ fire: 10 });
      const goals = deriveGoals(cards, atlas);
      expect(goals).toHaveLength(1);
    });

    it('skips Site cards', () => {
      const cards = [
        makeSite('Fire Site', ['Fire'], { fire: 1 }, 10),
        makeSpell('Fireball', 3, { fire: 1 }),
      ];
      const atlas = buildTestAtlas({ fire: 10 });
      const goals = deriveGoals(cards, atlas);
      expect(goals).toHaveLength(1);
      expect(goals[0].cardNames).toContain('Fireball');
    });

    it('marks multi-element goals', () => {
      const cards = [
        makeSpell('Dual Spell', 4, { fire: 1, water: 1 }),
      ];
      const atlas = buildTestAtlas({ fire: 10, water: 5 });
      const goals = deriveGoals(cards, atlas);
      expect(goals[0].isMultiElement).toBe(true);
      expect(goals[0].activeElementCount).toBe(2);
    });
  });

  describe('defaultNSeen', () => {
    it('returns turn + 2 (3 sites on turn 1)', () => {
      const atlas = { N: 30, sites: [], sourceCounts: {} };
      expect(defaultNSeen(atlas, 1)).toBe(3);
      expect(defaultNSeen(atlas, 2)).toBe(4);
      expect(defaultNSeen(atlas, 3)).toBe(5);
      expect(defaultNSeen(atlas, 5)).toBe(7);
    });

    it('clamps to atlas size', () => {
      const atlas = { N: 4, sites: [], sourceCounts: {} };
      expect(defaultNSeen(atlas, 1)).toBe(3);
      expect(defaultNSeen(atlas, 5)).toBe(4);
    });

    it('minimum is 3', () => {
      const atlas = { N: 30, sites: [], sourceCounts: {} };
      expect(defaultNSeen(atlas, 0)).toBe(3);
    });
  });

  describe('multi-pip site handling', () => {
    it('routes to Monte Carlo when multi-pip sites exist', () => {
      // 29 blank sites + 1 site with fire=2
      const cards = [
        makeSite('Big Fire', ['Fire'], { fire: 2 }, 1),
        makeSite('Blank Site', [], {}, 29),
      ];
      const atlas = buildAtlas(cards);
      const goal = {
        id: 'test',
        requirement: { fire: 2, water: 0, earth: 0, air: 0 },
        cardNames: ['Test Card'],
        targetTurn: 3,
        isMultiElement: false,
        activeElementCount: 1,
      };
      const result = evaluateGoal(goal, atlas, 5);
      expect(result.method).toBe('montecarlo');
    });

    it('Monte Carlo > 0 when hypergeometric would give 0 (decisive test)', () => {
      // N=30, exactly 1 site has fire=2, 0 other fire sites
      // Goal: fire >= 2, n=1
      // MC P ≈ 1/30 ≈ 3.3% (that one site satisfies r=2 alone)
      // Hypergeometric with K_sites=1, r=2, n=1 → exactly 0
      const cards = [
        makeSite('Big Fire', ['Fire'], { fire: 2 }, 1),
        makeSite('Blank Site', [], {}, 29),
      ];
      const atlas = buildAtlas(cards);
      const goal = {
        id: 'test',
        requirement: { fire: 2, water: 0, earth: 0, air: 0 },
        cardNames: ['Test Card'],
        targetTurn: 1,
        isMultiElement: false,
        activeElementCount: 1,
      };
      const result = evaluateGoal(goal, atlas, 1);
      expect(result.method).toBe('montecarlo');
      // Should be roughly 1/30 ≈ 3.3%, generous band for 50k trials
      expect(result.probability).toBeGreaterThan(0.01);
      expect(result.probability).toBeLessThan(0.08);
    });

    it('binary pips stay hypergeometric', () => {
      // Atlas: only 0-or-1 pip sites
      const atlas = buildTestAtlas({ fire: 10 });
      const goal = {
        id: 'test',
        requirement: { fire: 2, water: 0, earth: 0, air: 0 },
        cardNames: ['Test Card'],
        targetTurn: 3,
        isMultiElement: false,
        activeElementCount: 1,
      };
      const result = evaluateGoal(goal, atlas, 5);
      expect(result.method).toBe('hypergeometric');
    });

    it('K uses site count, not pip sum, in hypergeometric path', () => {
      // 10 sites with fire=1, 20 blank (all binary)
      const atlas = buildTestAtlas({ fire: 10 });
      const goal = {
        id: 'test',
        requirement: { fire: 2, water: 0, earth: 0, air: 0 },
        cardNames: ['Test Card'],
        targetTurn: 3,
        isMultiElement: false,
        activeElementCount: 1,
      };
      const result = evaluateGoal(goal, atlas, 5);
      expect(result.method).toBe('hypergeometric');
      expect(result.mathDetails.K).toBe(10);
    });
  });

  describe('evaluateAllGoals with turnOverride', () => {
    it('uses per-goal targetTurn when turnOverride is null', () => {
      const atlas = buildTestAtlas({ fire: 10 });
      const goals = [
        {
          id: '1-0-0-0',
          requirement: { fire: 1, water: 0, earth: 0, air: 0 },
          cardNames: ['A'],
          targetTurn: 2,
          isMultiElement: false,
          activeElementCount: 1,
        },
        {
          id: '2-0-0-0',
          requirement: { fire: 2, water: 0, earth: 0, air: 0 },
          cardNames: ['B'],
          targetTurn: 5,
          isMultiElement: false,
          activeElementCount: 1,
        },
      ];
      const results = evaluateAllGoals(goals, atlas, null, 0.9);
      // T2 → n=4, T5 → n=7 — different n values
      expect(results[0].mathDetails.n).toBe(4);
      expect(results[1].mathDetails.n).toBe(7);
    });

    it('applies turnOverride to all goals', () => {
      const atlas = buildTestAtlas({ fire: 10 });
      const goals = [
        {
          id: '1-0-0-0',
          requirement: { fire: 1, water: 0, earth: 0, air: 0 },
          cardNames: ['A'],
          targetTurn: 2,
          isMultiElement: false,
          activeElementCount: 1,
        },
        {
          id: '2-0-0-0',
          requirement: { fire: 2, water: 0, earth: 0, air: 0 },
          cardNames: ['B'],
          targetTurn: 5,
          isMultiElement: false,
          activeElementCount: 1,
        },
      ];
      const results = evaluateAllGoals(goals, atlas, 3, 0.9);
      // Both use turn 3 → n=5
      expect(results[0].mathDetails.n).toBe(5);
      expect(results[1].mathDetails.n).toBe(5);
    });
  });
});
