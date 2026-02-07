import { useState, useMemo } from 'react';
import { useDeckFilter } from '../context/DeckFilterContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { Element, ELEMENT_LABELS } from '../lib/enums';
import {
  buildAtlas,
  deriveGoals,
  evaluateAllGoals,
  clearCache,
} from '../lib/threshold-calculator';

const ELEMENTS = [Element.Fire, Element.Water, Element.Earth, Element.Air];

const ELEMENT_COLORS = {
  [Element.Fire]: '#dd7230',
  [Element.Water]: '#208aae',
  [Element.Earth]: '#79b791',
  [Element.Air]: '#ffd131',
};

const TARGET_OPTIONS = [0.8, 0.9, 0.95];

function probColor(p, target) {
  if (p >= target) return 'bg-emerald-500';
  if (p >= 0.5) return 'bg-amber-500';
  return 'bg-red-500';
}

function probTextColor(p, target) {
  if (p >= target) return 'text-emerald-400';
  if (p >= 0.5) return 'text-amber-400';
  return 'text-red-400';
}

function ElementBadge({ element, count }) {
  const color = ELEMENT_COLORS[element];
  const label = ELEMENT_LABELS[element];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '25', color, border: `1px solid ${color}55` }}
    >
      {label} {count}
    </span>
  );
}

function ProbabilityBar({ probability, target }) {
  const pct = Math.round(probability * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-shadow-grey-700 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all ${probColor(probability, target)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-medium ${probTextColor(probability, target)}`}>
        {pct}%
      </span>
    </div>
  );
}

function MathDetails({ result }) {
  const { method, mathDetails } = result;

  if (method === 'hypergeometric') {
    const { N, K, n, r, element } = mathDetails;
    return (
      <div className="mt-2 p-3 bg-shadow-grey-800/50 rounded-lg text-xs text-shadow-grey-400 space-y-1">
        <div className="font-medium text-shadow-grey-300">Hypergeometric (exact)</div>
        <div>Each drawn site counts as 1 success if it has &ge;1 {ELEMENT_LABELS[element]} pip (binary).</div>
        <div>P(X &ge; {r}) where X ~ Hypergeometric(N={N}, K={K}, n={n})</div>
        <div>
          N = {N} sites, K = {K} sites with &ge;1 {ELEMENT_LABELS[element]} pip, n = {n} sites seen, r = {r} required
        </div>
      </div>
    );
  }

  const { N, n, requirement, trials } = mathDetails;
  const reqParts = ELEMENTS
    .filter((e) => requirement[e] > 0)
    .map((e) => `${ELEMENT_LABELS[e]} pips >= ${requirement[e]}`);

  return (
    <div className="mt-2 p-3 bg-shadow-grey-800/50 rounded-lg text-xs text-shadow-grey-400 space-y-1">
      <div className="font-medium text-shadow-grey-300">Monte Carlo simulation (pip-sum)</div>
      <div>Each drawn site contributes its actual pip value; sum compared to requirement.</div>
      <div>{trials.toLocaleString()} trials — draw {n} from {N} sites, sum pips per element</div>
      <div>Requirement: {reqParts.join(', ')}</div>
      {result.ciLow != null && (
        <div>95% CI: [{(result.ciLow * 100).toFixed(1)}%, {(result.ciHigh * 100).toFixed(1)}%]</div>
      )}
    </div>
  );
}

function RecommendationCard({ rec }) {
  const addParts = ELEMENTS
    .filter((e) => rec.addSources[e] > 0)
    .map((e) => (
      <span key={e} style={{ color: ELEMENT_COLORS[e] }}>
        +{rec.addSources[e]} {ELEMENT_LABELS[e]}
      </span>
    ));

  return (
    <div className="mt-2 p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg text-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-amber-300 font-medium">Suggestion:</span>
        <span className="text-shadow-grey-200">
          Add {addParts.reduce((acc, el, i) => (i === 0 ? [el] : [...acc, ', ', el]), [])} source{rec.totalAdds !== 1 ? 's' : ''}
        </span>
        <span className="text-shadow-grey-400">
          &rarr; {Math.round(rec.newProbability * 100)}% reliability
        </span>
      </div>
      {rec.cutSuggestion && (
        <div className="mt-1 text-xs text-shadow-grey-400">
          Consider cutting from{' '}
          <span style={{ color: ELEMENT_COLORS[rec.cutSuggestion.element] }}>
            {ELEMENT_LABELS[rec.cutSuggestion.element]}
          </span>{' '}
          (most represented non-required element)
        </div>
      )}
    </div>
  );
}

function GoalRowDesktop({ result, target, expanded, onToggle }) {
  const { goal, probability, passes, method, recommendation } = result;
  const pct = Math.round(probability * 100);

  return (
    <div className="border border-shadow-grey-700/50 rounded-lg overflow-hidden">
      <div
        className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-3 items-center p-3 cursor-pointer hover:bg-shadow-grey-800/30 transition-colors"
        onClick={onToggle}
      >
        {/* Requirement badges */}
        <div className="flex flex-wrap gap-1">
          {ELEMENTS.filter((e) => goal.requirement[e] > 0).map((e) => (
            <ElementBadge key={e} element={e} count={goal.requirement[e]} />
          ))}
        </div>

        {/* Turn + sites seen */}
        <div className="text-sm text-shadow-grey-400">
          T{goal.targetTurn}
          <span className="text-shadow-grey-500 text-xs ml-1">(n={result.mathDetails.n})</span>
        </div>

        {/* Probability bar */}
        <ProbabilityBar probability={probability} target={target} />

        {/* Pass/Fail */}
        <div className={`text-lg ${passes ? 'text-emerald-400' : 'text-red-400'}`}>
          {passes ? '\u2713' : '\u2717'}
        </div>

        {/* Expand chevron */}
        <div className={`text-shadow-grey-500 transition-transform text-xs ${expanded ? 'rotate-180' : ''}`}>
          &#9660;
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-shadow-grey-700/50">
          {/* Card names */}
          <div className="mt-2 text-xs text-shadow-grey-400">
            <span className="text-shadow-grey-500">Cards: </span>
            {goal.cardNames.length <= 3
              ? goal.cardNames.join(', ')
              : `${goal.cardNames.slice(0, 3).join(', ')} +${goal.cardNames.length - 3} more`}
          </div>

          <MathDetails result={result} />
          {recommendation && <RecommendationCard rec={recommendation} />}
        </div>
      )}
    </div>
  );
}

function GoalCardMobile({ result, target, expanded, onToggle }) {
  const { goal, probability, passes, method, recommendation } = result;

  return (
    <div className="border border-shadow-grey-700/50 rounded-lg overflow-hidden">
      <div
        className="p-3 cursor-pointer active:bg-shadow-grey-800/30 transition-colors"
        onClick={onToggle}
      >
        {/* Top row: badges + status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {ELEMENTS.filter((e) => goal.requirement[e] > 0).map((e) => (
              <ElementBadge key={e} element={e} count={goal.requirement[e]} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${passes ? 'text-emerald-400' : 'text-red-400'}`}>
              {passes ? '\u2713' : '\u2717'}
            </span>
            <span className={`text-shadow-grey-500 transition-transform text-xs ${expanded ? 'rotate-180' : ''}`}>
              &#9660;
            </span>
          </div>
        </div>

        {/* Probability bar */}
        <div className="mt-2">
          <ProbabilityBar probability={probability} target={target} />
        </div>

        {/* Turn + sites seen */}
        <div className="mt-1 flex gap-3 text-xs text-shadow-grey-500">
          <span>Turn {goal.targetTurn} (n={result.mathDetails.n} sites seen)</span>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-shadow-grey-700/50">
          <div className="mt-2 text-xs text-shadow-grey-400">
            <span className="text-shadow-grey-500">Cards: </span>
            {goal.cardNames.length <= 3
              ? goal.cardNames.join(', ')
              : `${goal.cardNames.slice(0, 3).join(', ')} +${goal.cardNames.length - 3} more`}
          </div>
          <MathDetails result={result} />
          {recommendation && <RecommendationCard rec={recommendation} />}
        </div>
      )}
    </div>
  );
}

export default function ThresholdReliabilityPanel() {
  const { deck } = useDeckFilter();
  const isMobile = useIsMobile();

  const [targetProbability, setTargetProbability] = useState(0.9);
  const [turnOverride, setTurnOverride] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState(new Set());

  const atlas = useMemo(() => buildAtlas(deck.cards), [deck.cards]);
  const goals = useMemo(() => deriveGoals(deck.cards, atlas), [deck.cards, atlas]);
  const results = useMemo(
    () => evaluateAllGoals(goals, atlas, turnOverride, targetProbability),
    [goals, atlas, turnOverride, targetProbability],
  );

  const toggleGoal = (id) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // No threshold goals — don't render
  if (goals.length === 0) return null;

  const atlasSummary = ELEMENTS
    .filter((e) => atlas.sourceCounts[e] > 0)
    .map((e) => `${atlas.sourceCounts[e]} ${ELEMENT_LABELS[e]} pip${atlas.sourceCounts[e] !== 1 ? 's' : ''}`)
    .join(', ');

  const failCount = results.filter((r) => !r.passes).length;

  return (
    <div className="section-panel-mint p-3 sm:p-5 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-shadow-grey-100">
          Threshold Reliability
        </h3>
        {failCount > 0 && (
          <span className="text-xs px-2 py-0.5 bg-red-900/40 border border-red-700/50 rounded-full text-red-300">
            {failCount} below target
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Atlas summary */}
        <div className="text-sm text-shadow-grey-400">
          <span className="text-shadow-grey-500">Atlas:</span>{' '}
          {atlas.N} site{atlas.N !== 1 ? 's' : ''}
          {atlasSummary && <span className="text-shadow-grey-500"> ({atlasSummary})</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {/* Target probability toggles */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-shadow-grey-500 mr-1">Target:</span>
            {TARGET_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTargetProbability(t)}
                className={`px-2.5 py-1 min-h-[36px] sm:min-h-0 text-xs rounded transition-colors ${
                  targetProbability === t
                    ? 'bg-mint-cream-700/50 text-mint-cream-200 border border-mint-cream-500/50'
                    : 'bg-shadow-grey-800/60 text-shadow-grey-400 border border-shadow-grey-600 hover:text-shadow-grey-200'
                }`}
              >
                {Math.round(t * 100)}%
              </button>
            ))}
          </div>

          {/* Turn override */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-shadow-grey-500">Eval turn:</span>
            <button
              onClick={() => setTurnOverride(null)}
              className={`px-2 py-1 min-h-[36px] sm:min-h-0 text-xs rounded transition-colors ${
                turnOverride === null
                  ? 'bg-mint-cream-700/50 text-mint-cream-200 border border-mint-cream-500/50'
                  : 'bg-shadow-grey-800/60 text-shadow-grey-400 border border-shadow-grey-600 hover:text-shadow-grey-200'
              }`}
            >
              Auto
            </button>
            <input
              type="number"
              min={1}
              max={10}
              value={turnOverride ?? ''}
              placeholder="T"
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  setTurnOverride(null);
                } else {
                  const t = Math.max(1, Math.min(10, parseInt(v, 10) || 1));
                  setTurnOverride(t);
                }
              }}
              className="w-14 px-2 py-1 min-h-[36px] sm:min-h-0 text-xs text-center bg-shadow-grey-800 border border-shadow-grey-600 rounded text-shadow-grey-200 focus:outline-none focus:border-mint-cream-500/50"
            />
          </div>
        </div>
      </div>

      {/* Goals */}
      {atlas.N === 0 ? (
        <div className="text-sm text-shadow-grey-400 text-center py-4">
          No sites in deck — all thresholds have 0% reliability.
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((r) =>
            isMobile ? (
              <GoalCardMobile
                key={r.goal.id}
                result={r}
                target={targetProbability}
                expanded={expandedGoals.has(r.goal.id)}
                onToggle={() => toggleGoal(r.goal.id)}
              />
            ) : (
              <GoalRowDesktop
                key={r.goal.id}
                result={r}
                target={targetProbability}
                expanded={expandedGoals.has(r.goal.id)}
                onToggle={() => toggleGoal(r.goal.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
