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

const BASE_COLOR = '#208aae';

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Mana Curve',
      color: CHART_THEME.titleColor,
      font: {
        size: 16,
        weight: 'bold',
      },
    },
    tooltip: {
      filter: (item) => item.raw > 0,
      callbacks: {
        label: (ctx) => {
          if (ctx.datasetIndex === 0) return `Matched: ${ctx.raw}`;
          return `Other: ${ctx.raw}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      stacked: true,
      ticks: {
        color: CHART_THEME.tickColor,
        stepSize: 2,
      },
      grid: {
        color: CHART_THEME.gridColor,
      },
    },
    x: {
      stacked: true,
      ticks: {
        color: CHART_THEME.tickColor,
      },
      grid: {
        display: false,
      },
    },
  },
};

export default function ManaCurveChart() {
  const chartRef = useRef(null);
  const { pageFilter, toggleFilter, baseStats, filteredStats } = useDeckFilter();
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7+'];

  const filteredValues = labels.map((l) => filteredStats.manaCurve[l] || 0);
  const remainderValues = labels.map(
    (l) => Math.max(0, (baseStats.manaCurve[l] || 0) - (filteredStats.manaCurve[l] || 0)),
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Cards',
        data: filteredValues,
        backgroundColor: BASE_COLOR,
        borderColor: '#186e8b',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Remainder',
        data: remainderValues,
        backgroundColor: CHART_THEME.remainderColor,
        borderColor: 'transparent',
        borderWidth: 0,
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
      toggleFilter('cost', labels[index]);
    },
    [toggleFilter],
  );

  return (
    <div className="section-panel-cyan p-3 sm:p-5 h-56 md:h-80 [&_canvas]:!cursor-pointer">
      <Bar ref={chartRef} options={options} data={data} onClick={handleClick} />
    </div>
  );
}
