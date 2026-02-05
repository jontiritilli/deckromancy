import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RARITY_COLORS = {
  Ordinary: '#9ca3af',
  Exceptional: '#22c55e',
  Elite: '#3b82f6',
  Unique: '#f59e0b',
};

const RARITY_ORDER = ['Ordinary', 'Exceptional', 'Elite', 'Unique'];

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
      color: '#e5e7eb',
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
        color: '#9ca3af',
      },
      grid: {
        color: '#374151',
      },
    },
    y: {
      ticks: {
        color: '#9ca3af',
      },
      grid: {
        display: false,
      },
    },
  },
};

export default function RarityChart({ rarityBreakdown }) {
  // Sort rarities in a consistent order
  const labels = RARITY_ORDER.filter((r) => rarityBreakdown[r] > 0);
  const dataValues = labels.map((r) => rarityBreakdown[r]);
  const colors = labels.map((r) => RARITY_COLORS[r] || '#6b7280');

  const data = {
    labels,
    datasets: [
      {
        label: 'Cards',
        data: dataValues,
        backgroundColor: colors,
        borderColor: colors.map((c) => c),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-64">
      <Bar options={options} data={data} />
    </div>
  );
}
