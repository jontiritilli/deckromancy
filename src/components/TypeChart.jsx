import { useState, useRef, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie, Doughnut, getElementAtEvent } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const TYPE_COLORS = {
  Minion: '#8b5cf6',
  Magic: '#06b6d4',
  Site: '#f59e0b',
  Aura: '#ec4899',
  Artifact: '#6b7280',
  Unknown: '#374151',
};

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

export default function TypeChart({ typeBreakdown, typeElementBreakdown }) {
  const [drilldownType, setDrilldownType] = useState(null);
  const chartRef = useRef(null);

  const handlePieClick = useCallback(
    (event) => {
      if (!chartRef.current) return;
      const elems = getElementAtEvent(chartRef.current, event);
      if (elems.length === 0) return;
      const index = elems[0].index;
      const label = Object.keys(typeBreakdown)[index];
      if (label && typeElementBreakdown?.[label]) {
        setDrilldownType(label);
      }
    },
    [typeBreakdown, typeElementBreakdown],
  );

  // Top-level: Pie of card types
  if (drilldownType === null) {
    const labels = Object.keys(typeBreakdown);
    const dataValues = Object.values(typeBreakdown);
    const colors = labels.map(
      (type) => TYPE_COLORS[type] || TYPE_COLORS.Unknown,
    );

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

    return (
      <div className="bg-gray-800 rounded-lg p-4 h-64">
        <Pie
          ref={chartRef}
          options={options}
          data={data}
          onClick={handlePieClick}
        />
      </div>
    );
  }

  // Drilled down: Doughnut of element breakdown for the selected type
  const breakdown = typeElementBreakdown[drilldownType] || {};
  const activeElements = Object.entries(breakdown).filter(
    ([, count]) => count > 0,
  );

  const labels = activeElements.map(([el]) => ELEMENT_LABELS[el] || el);
  const dataValues = activeElements.map(([, count]) => count);
  const colors = activeElements.map(([el]) => ELEMENT_COLORS[el] || '#6b7280');

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
        text: `${drilldownType} Elements`,
        color: '#e5e7eb',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-64 relative">
      <button
        onClick={() => setDrilldownType(null)}
        className="absolute top-2 right-2 z-10 px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-xs text-gray-300 transition-colors"
      >
        Back to Types
      </button>
      <Doughnut options={options} data={data} />
    </div>
  );
}
