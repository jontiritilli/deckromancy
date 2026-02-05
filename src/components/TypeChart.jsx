import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const TYPE_COLORS = {
  Minion: '#8b5cf6',
  Magic: '#06b6d4',
  Site: '#f59e0b',
  Aura: '#ec4899',
  Artifact: '#6b7280',
  Unknown: '#374151',
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
      text: 'Card Types',
      color: '#e5e7eb',
      font: {
        size: 16,
        weight: 'bold',
      },
    },
  },
};

export default function TypeChart({ typeBreakdown }) {
  const labels = Object.keys(typeBreakdown);
  const dataValues = Object.values(typeBreakdown);
  const colors = labels.map((type) => TYPE_COLORS[type] || TYPE_COLORS.Unknown);

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
      <Pie options={options} data={data} />
    </div>
  );
}
