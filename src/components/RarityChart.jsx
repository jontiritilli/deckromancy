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
import { CHART_THEME } from '../lib/chart-theme';
import { Rarity, RARITY_ORDER } from '../lib/enums';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RARITY_COLORS = {
  [Rarity.Ordinary]: '#7e8db4',
  [Rarity.Exceptional]: '#79b791',
  [Rarity.Elite]: '#208aae',
  [Rarity.Unique]: '#ffd131',
};

const options = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Rarity Distribution',
      color: CHART_THEME.titleColor,
      font: {
        size: 16,
        weight: 'bold',
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        color: CHART_THEME.tickColor,
      },
      grid: {
        color: CHART_THEME.gridColor,
      },
    },
    y: {
      ticks: {
        color: CHART_THEME.tickColor,
      },
      grid: {
        display: false,
      },
    },
  },
};

export default function RarityChart() {
  const chartRef = useRef(null);
  const { pageFilter, toggleFilter, filteredStats } = useDeckFilter();
  const { rarityBreakdown } = filteredStats;
  const activeRarity = pageFilter.rarity;

  // Sort rarities in a consistent order
  const labels = RARITY_ORDER.filter((r) => rarityBreakdown[r] > 0);
  const dataValues = labels.map((r) => rarityBreakdown[r]);
  const colors = labels.map((r) => {
    const base = RARITY_COLORS[r] || '#5e70a1';
    if (activeRarity === null) return base;
    return r === activeRarity ? base : base + '33';
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
      toggleFilter('rarity', labels[index]);
    },
    [toggleFilter, labels],
  );

  return (
    <div className="section-panel-rosy p-3 sm:p-5 h-56 md:h-72 [&_canvas]:!cursor-pointer">
      <Bar ref={chartRef} options={options} data={data} onClick={handleClick} />
    </div>
  );
}
