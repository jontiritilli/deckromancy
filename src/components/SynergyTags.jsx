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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CATEGORY_COLORS = {
  Abilities: '#10b981',
  Triggers: '#f59e0b',
  Mechanics: '#0ea5e9',
  Positioning: '#9ca3af',
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
        color: '#e5e7eb',
        font: { size: 14, weight: 'bold' },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: '#9ca3af', stepSize: 1 },
        grid: { color: '#374151' },
      },
      y: {
        ticks: { color: '#9ca3af' },
        grid: { display: false },
      },
    },
  };
}

function CategoryChart({ category, keywords, activeKeyword, toggleFilter }) {
  const chartRef = useRef(null);
  const color = CATEGORY_COLORS[category] || '#6b7280';

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
    <div className="bg-gray-800 rounded-lg p-4 [&_canvas]:!cursor-pointer" style={{ height }}>
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
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Themes</h3>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <span
                key={theme}
                className="px-3 py-1 bg-purple-900/50 border border-purple-600 rounded-full text-sm text-purple-300"
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
