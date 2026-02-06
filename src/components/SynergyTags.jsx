import { useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { useDeckFilter } from '../context/DeckFilterContext';
import { KEYWORD_CATEGORIES } from '../lib/deck-analyzer';
import { CHART_THEME } from '../lib/chart-theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CATEGORY_COLORS = {
  Abilities: '#79b791',
  Triggers: '#ffd131',
  Mechanics: '#208aae',
  Positioning: '#ad8593',
};

const CATEGORY_ACCENTS = {
  Abilities: 'border-t-4 border-t-mint-cream-400',
  Triggers: 'border-t-4 border-t-yellow-400',
  Mechanics: 'border-t-4 border-t-pacific-cyan-500',
  Positioning: 'border-t-4 border-t-rosy-granite-400',
};

// Build a reverse lookup: keyword → category
const keywordToCategory = {};
for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
  for (const kw of keywords) {
    keywordToCategory[kw] = category;
  }
}

function buildChartOptions(title) {
  return {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: CHART_THEME.titleColor,
        font: { size: 14, weight: 'bold' },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: CHART_THEME.tickColor, stepSize: 1 },
        grid: { color: CHART_THEME.gridColor },
      },
      y: {
        ticks: { color: CHART_THEME.tickColor },
        grid: { display: false },
      },
    },
  };
}

function CategoryChart({ category, keywords, activeKeyword, toggleFilter }) {
  const chartRef = useRef(null);
  const color = CATEGORY_COLORS[category] || '#5e70a1';
  const accent = CATEGORY_ACCENTS[category] || '';

  const labels = keywords.map(([kw]) => kw);
  const dataValues = keywords.map(([, count]) => count);
  const colors = labels.map((kw) => {
    if (activeKeyword === null) return color;
    return kw === activeKeyword ? color : color + '54';
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Cards',
        data: dataValues,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const handleClick = useCallback(
    (event) => {
      if (!chartRef.current) return;
      const elems = getElementAtEvent(chartRef.current, event);
      if (elems.length === 0) return;
      const index = elems[0].index;
      toggleFilter('keyword', labels[index]);
    },
    [toggleFilter, labels],
  );

  // Dynamic height based on number of keywords
  const height = Math.max(120, keywords.length * 28 + 50);

  return (
    <div className={`section-panel p-4 [&_canvas]:!cursor-pointer ${accent}`} style={{ height }}>
      <Bar ref={chartRef} options={buildChartOptions(category)} data={data} onClick={handleClick} />
    </div>
  );
}

export default function SynergyTags() {
  const { deck, pageFilter, toggleFilter, filteredStats } = useDeckFilter();
  const { themes } = deck.synergies;
  const { keywordBreakdown } = filteredStats;
  const activeKeyword = pageFilter.keyword;

  // Group keywords by category
  const grouped = {};
  for (const [kw, count] of Object.entries(keywordBreakdown)) {
    if (count <= 0) continue;
    const cat = keywordToCategory[kw] || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push([kw, count]);
  }

  // Sort each group by count descending
  for (const entries of Object.values(grouped)) {
    entries.sort(([, a], [, b]) => b - a);
  }

  // Display order
  const categoryOrder = ['Abilities', 'Triggers', 'Mechanics', 'Positioning'];
  const activeCategories = categoryOrder.filter((cat) => grouped[cat]);

  if (activeCategories.length === 0 && themes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Keyword category charts */}
      {activeCategories.length > 0 && (
        <>
          <div className="section-label text-shadow-grey-400">Keyword Synergies</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCategories.map((category) => (
              <CategoryChart
                key={category}
                category={category}
                keywords={grouped[category]}
                activeKeyword={activeKeyword}
                toggleFilter={toggleFilter}
              />
            ))}
          </div>
        </>
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <div className="section-panel p-4">
          <div className="section-label text-rosy-granite-400">Detected Themes</div>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <span
                key={theme}
                className="px-3 py-1 bg-rosy-granite-900/50 border border-rosy-granite-500/50 rounded-full text-sm text-rosy-granite-200"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
