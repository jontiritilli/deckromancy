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

export default function ManaCurveChart({ manaCurve }) {
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7+'];
  const dataValues = labels.map((label) => manaCurve[label] || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Cards',
        data: dataValues,
        backgroundColor: '#8b5cf6',
        borderColor: '#7c3aed',
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
