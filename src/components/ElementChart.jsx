import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ELEMENT_COLORS = {
  fire: '#ef4444',
  water: '#3b82f6',
  earth: '#22c55e',
  air: '#eab308',
  none: '#6b7280',
};

const ELEMENT_LABELS = {
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  air: 'Air',
  none: 'None',
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#e5e7eb',
        padding: 12,
        usePointStyle: true,
      },
    },
    title: {
      display: true,
      text: 'Elements',
      color: '#e5e7eb',
      font: {
        size: 16,
        weight: 'bold',
      },
    },
  },
};

export default function ElementChart({ elementBreakdown }) {
  // Filter out elements with 0 cards
  const activeElements = Object.entries(elementBreakdown)
    .filter(([, count]) => count > 0);

  const labels = activeElements.map(([el]) => ELEMENT_LABELS[el]);
  const dataValues = activeElements.map(([, count]) => count);
  const colors = activeElements.map(([el]) => ELEMENT_COLORS[el]);

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: colors,
        borderColor: '#1f2937',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-64">
      <Doughnut options={options} data={data} />
    </div>
  );
}
