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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ELEMENT_COLORS = {
  fire: '#dd7230',
  water: '#208aae',
  earth: '#79b791',
  air: '#ffd131',
};

const ELEMENT_LABELS = {
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  air: 'Air',
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: CHART_THEME.titleColor,
      },
    },
    title: {
      display: true,
      text: 'Site Distribution vs Thresholds',
      color: CHART_THEME.titleColor,
      font: {
        size: 16,
        weight: 'bold',
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: CHART_THEME.tickColor,
        stepSize: 1,
      },
      grid: {
        color: CHART_THEME.gridColor,
      },
    },
    x: {
      ticks: {
        color: CHART_THEME.tickColor,
      },
      grid: {
        display: false,
      },
    },
  },
};

export default function SiteDistributionChart() {
  const chartRef = useRef(null);
  const { pageFilter, toggleFilter, filteredStats } = useDeckFilter();
  const { siteElementBreakdown, maxThresholds } = filteredStats;
  const activeElement = pageFilter.element;

  const elements = ['fire', 'water', 'earth', 'air'];

  // Only show elements that have either sites or a threshold > 0
  const active = elements.filter(
    (el) => siteElementBreakdown[el] > 0 || maxThresholds[el] > 0
  );

  const labels = active.map((el) => ELEMENT_LABELS[el]);

  const handleClick = useCallback(
    (event) => {
      if (!chartRef.current) return;
      const elems = getElementAtEvent(chartRef.current, event);
      if (elems.length === 0) return;
      const index = elems[0].index;
      const clickedLabel = labels[index];
      toggleFilter('element', clickedLabel);
    },
    [toggleFilter, labels],
  );

  if (active.length === 0) return null;

  const siteData = active.map((el) => siteElementBreakdown[el]);
  const thresholdData = active.map((el) => maxThresholds[el]);
  const colors = active.map((el) => {
    const base = ELEMENT_COLORS[el];
    const label = ELEMENT_LABELS[el];
    if (activeElement === null) return base;
    return label === activeElement ? base : base + '33';
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Sites Owned',
        data: siteData,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Max Threshold',
        data: thresholdData,
        backgroundColor: colors.map((c) => c.length <= 7 ? c + '55' : c.slice(0, 7) + '55'),
        borderColor: colors,
        borderWidth: 2,
        borderDash: [4, 4],
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="section-panel-mint p-5 h-72 [&_canvas]:!cursor-pointer">
      <Bar ref={chartRef} options={options} data={data} onClick={handleClick} />
    </div>
  );
}
