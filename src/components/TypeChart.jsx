import { useState, useRef, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie, Doughnut, getElementAtEvent } from 'react-chartjs-2';
import { useDeckFilter } from '../context/DeckFilterContext';
import { CHART_THEME } from '../lib/chart-theme';

ChartJS.register(ArcElement, Tooltip, Legend);

const TYPE_COLORS = {
  Minion: '#208aae',
  Magic: '#79b791',
  Site: '#dd7230',
  Aura: '#ffd131',
  Artifact: '#0d324d',
  Unknown: '#262d40',
};

const ELEMENT_COLORS = {
  fire: '#dd7230',
  water: '#208aae',
  earth: '#79b791',
  air: '#ffd131',
  none: '#5e70a1',
};

const ELEMENT_LABELS = {
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  air: 'Air',
  none: 'None',
};

export default function TypeChart() {
  const [drilldownType, setDrilldownType] = useState(null);
  const chartRef = useRef(null);
  const { pageFilter, toggleFilter, filteredStats } = useDeckFilter();
  const { typeBreakdown, typeElementBreakdown } = filteredStats;
  const activeType = pageFilter.type;

  const handlePieClick = useCallback(
    (event) => {
      if (!chartRef.current) return;
      const elems = getElementAtEvent(chartRef.current, event);
      if (elems.length === 0) return;
      const index = elems[0].index;
      const label = Object.keys(typeBreakdown)[index];
      if (label) {
        toggleFilter('type', label);
      }
    },
    [typeBreakdown, toggleFilter],
  );

  // Drilldown view: Doughnut of element breakdown for the selected type
  if (drilldownType !== null) {
    const breakdown = typeElementBreakdown[drilldownType] || {};
    const activeElements = Object.entries(breakdown).filter(
      ([, count]) => count > 0,
    );

    const labels = activeElements.map(([el]) => ELEMENT_LABELS[el] || el);
    const dataValues = activeElements.map(([, count]) => count);
    const colors = activeElements.map(([el]) => ELEMENT_COLORS[el] || '#5e70a1');

    const data = {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: colors,
          borderColor: CHART_THEME.borderColor,
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
            color: CHART_THEME.titleColor,
            padding: 12,
            usePointStyle: true,
          },
        },
        title: {
          display: true,
          text: `${drilldownType} Elements`,
          color: CHART_THEME.titleColor,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
    };

    return (
      <div className="section-panel-sandy p-5 h-72 relative">
        <button
          onClick={() => setDrilldownType(null)}
          className="absolute top-2 right-2 z-10 px-2 py-1 bg-shadow-grey-700 hover:bg-shadow-grey-600 border border-shadow-grey-600 rounded text-xs text-shadow-grey-300 transition-colors"
        >
          Back to Types
        </button>
        <Doughnut options={options} data={data} />
      </div>
    );
  }

  // Top-level: Pie of card types
  const labels = Object.keys(typeBreakdown);
  const dataValues = Object.values(typeBreakdown);
  const colors = labels.map((type) => {
    const base = TYPE_COLORS[type] || TYPE_COLORS.Unknown;
    if (activeType === null) return base;
    return type === activeType ? base : base + '33';
  });

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: colors,
        borderColor: CHART_THEME.borderColor,
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
          color: CHART_THEME.titleColor,
          padding: 12,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Card Types',
        color: CHART_THEME.titleColor,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  // Show "View Elements" button when a type is selected via page filter and has element data
  const canDrilldown = activeType && typeElementBreakdown?.[activeType];

  return (
    <div className="section-panel-sandy p-5 h-72 relative [&_canvas]:!cursor-pointer">
      {canDrilldown && (
        <button
          onClick={() => setDrilldownType(activeType)}
          className="absolute top-2 right-2 z-10 px-2 py-1 bg-mint-cream-700 hover:bg-mint-cream-600 border border-mint-cream-500 rounded text-xs text-mint-cream-100 transition-colors"
        >
          View Elements &rarr;
        </button>
      )}
      <Pie
        ref={chartRef}
        options={options}
        data={data}
        onClick={handlePieClick}
      />
    </div>
  );
}
