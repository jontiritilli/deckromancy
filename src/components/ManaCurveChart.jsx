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
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: CHART_THEME.tickColor,
        stepSize: 2,
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

const BASE_COLOR = '#208aae';
const DIM_COLOR = '#208aae33';

export default function ManaCurveChart() {
  const chartRef = useRef(null);
  const { pageFilter, toggleFilter, filteredStats } = useDeckFilter();
  const { manaCurve } = filteredStats;
  const activeCost = pageFilter.cost;

  const labels = ['0', '1', '2', '3', '4', '5', '6', '7+'];
  const dataValues = labels.map((label) => manaCurve[label] || 0);

  const bgColors = labels.map((label) =>
    activeCost === null ? BASE_COLOR : label === activeCost ? BASE_COLOR : DIM_COLOR
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Cards',
        data: dataValues,
        backgroundColor: bgColors,
        borderColor: '#186e8b',
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
      toggleFilter('cost', labels[index]);
    },
    [toggleFilter],
  );

  return (
    <div className="section-panel-cyan p-5 h-80 [&_canvas]:!cursor-pointer">
      <Bar ref={chartRef} options={options} data={data} onClick={handleClick} />
    </div>
  );
}
