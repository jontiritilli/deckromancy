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
      color: '#e5e7eb',
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
        color: '#9ca3af',
        stepSize: 2,
      },
      grid: {
        color: '#374151',
      },
    },
    x: {
      ticks: {
        color: '#9ca3af',
      },
      grid: {
        display: false,
      },
    },
  },
};

const BASE_COLOR = '#8b5cf6';
const DIM_COLOR = '#8b5cf633';

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
        borderColor: '#7c3aed',
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
    <div className="bg-gray-800 rounded-lg p-4 h-64 [&_canvas]:!cursor-pointer">
      <Bar ref={chartRef} options={options} data={data} onClick={handleClick} />
    </div>
  );
}
