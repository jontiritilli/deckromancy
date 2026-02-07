import { useState, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, getElementAtEvent } from 'react-chartjs-2';
import { useDeckFilter } from '../context/DeckFilterContext';
import { CHART_THEME } from '../lib/chart-theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { CardType, Element, ELEMENT_LABELS } from '../lib/enums';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const TYPE_COLORS = {
  [CardType.Minion]: '#208aae',
  [CardType.Magic]: '#79b791',
  [CardType.Site]: '#dd7230',
  [CardType.Aura]: '#ffd131',
  [CardType.Artifact]: '#0d324d',
  [CardType.Unknown]: '#262d40',
};

const TYPE_ORDER = [CardType.Minion, CardType.Magic, CardType.Site, CardType.Aura, CardType.Artifact];

const ELEMENT_COLORS = {
  [Element.Fire]: '#dd7230',
  [Element.Water]: '#208aae',
  [Element.Earth]: '#79b791',
  [Element.Air]: '#ffd131',
  [Element.None]: '#5e70a1',
};

export default function TypeChart() {
  const [drilldownType, setDrilldownType] = useState(null);
  const chartRef = useRef(null);
  const { pageFilter, toggleFilter, baseStats, filteredStats } = useDeckFilter();
  const isMobile = useIsMobile();

  // Drilldown view: Doughnut of element breakdown for the selected type
  if (drilldownType !== null) {
    const breakdown = baseStats.typeElementBreakdown[drilldownType] || {};
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
          position: isMobile ? 'bottom' : 'right',
          labels: {
            color: CHART_THEME.titleColor,
            padding: isMobile ? 8 : 12,
            usePointStyle: true,
          },
        },
        title: {
          display: true,
          text: `${drilldownType} Elements`,
          color: CHART_THEME.titleColor,
          font: {
            size: isMobile ? 14 : 16,
            weight: 'bold',
          },
        },
      },
    };

    return (
      <div className="section-panel-sandy p-3 sm:p-5 h-60 md:h-72 relative">
        <button
          onClick={() => setDrilldownType(null)}
          className="absolute top-2 right-2 z-10 px-2 py-1 bg-shadow-grey-200 hover:bg-shadow-grey-300 border border-shadow-grey-300 rounded text-xs text-shadow-grey-600 transition-colors"
        >
          Back to Types
        </button>
        <Doughnut options={options} data={data} />
      </div>
    );
  }

  // Top-level: Stacked horizontal bar of card types
  const labels = TYPE_ORDER.filter((t) => (baseStats.typeBreakdown[t] || 0) > 0);
  const filteredValues = labels.map((t) => filteredStats.typeBreakdown[t] || 0);
  const remainderValues = labels.map(
    (t) => Math.max(0, (baseStats.typeBreakdown[t] || 0) - (filteredStats.typeBreakdown[t] || 0)),
  );
  const colors = labels.map((t) => TYPE_COLORS[t] || TYPE_COLORS[CardType.Unknown]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Cards',
        data: filteredValues,
        backgroundColor: colors,
        borderColor: colors,
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

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Card Types',
        color: CHART_THEME.titleColor,
        font: {
          size: isMobile ? 14 : 16,
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
      x: {
        beginAtZero: true,
        stacked: true,
        ticks: { color: CHART_THEME.tickColor },
        grid: { color: CHART_THEME.gridColor },
      },
      y: {
        stacked: true,
        ticks: { color: CHART_THEME.tickColor },
        grid: { display: false },
      },
    },
  };

  const handleClick = useCallback(
    (event) => {
      if (!chartRef.current) return;
      const elems = getElementAtEvent(chartRef.current, event);
      if (elems.length === 0) return;
      const index = elems[0].index;
      if (labels[index]) {
        toggleFilter('type', labels[index]);
      }
    },
    [toggleFilter, labels],
  );

  // Show "View Elements" button when exactly one type is selected and has element data
  const canDrilldown = pageFilter.type.length === 1 && baseStats.typeElementBreakdown?.[pageFilter.type[0]];

  return (
    <div className="section-panel-sandy p-3 sm:p-5 h-60 md:h-72 relative [&_canvas]:!cursor-pointer">
      {canDrilldown && (
        <button
          onClick={() => setDrilldownType(pageFilter.type[0])}
          className="absolute top-2 right-2 z-10 px-2 py-1 bg-mint-cream-500 hover:bg-mint-cream-600 border border-mint-cream-600 rounded text-xs text-white transition-colors"
        >
          View Elements &rarr;
        </button>
      )}
      <Bar
        ref={chartRef}
        options={options}
        data={data}
        onClick={handleClick}
      />
    </div>
  );
}
