export default function StatsOverview({ stats }) {
  const { maxThresholds, typeBreakdown } = stats;

  // Count non-zero thresholds
  const activeThresholds = Object.entries(maxThresholds)
    .filter(([, val]) => val > 0)
    .map(([el, val]) => ({ element: el, value: val }));

  const statCards = [
    {
      label: 'Minions',
      value: typeBreakdown.Minion || 0,
      color: 'text-purple-400',
    },
    {
      label: 'Magics',
      value: typeBreakdown.Magic || 0,
      color: 'text-cyan-400',
    },
    {
      label: 'Sites',
      value: typeBreakdown.Site || 0,
      color: 'text-amber-400',
    },
    {
      label: 'Auras',
      value: typeBreakdown.Aura || 0,
      color: 'text-pink-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="bg-gray-800 rounded-lg p-4 text-center"
        >
          <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
        </div>
      ))}

      {/* Max Thresholds */}
      {activeThresholds.length > 0 && (
        <div className="col-span-2 md:col-span-4 bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-2">Max Thresholds Required</div>
          <div className="flex gap-4">
            {activeThresholds.map(({ element, value }) => (
              <ThresholdBadge key={element} element={element} value={value} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ThresholdBadge({ element, value }) {
  const colors = {
    fire: 'bg-red-900 text-red-300 border-red-700',
    water: 'bg-blue-900 text-blue-300 border-blue-700',
    earth: 'bg-green-900 text-green-300 border-green-700',
    air: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  };

  const icons = {
    fire: '\u{1F525}',
    water: '\u{1F4A7}',
    earth: '\u{1F33F}',
    air: '\u{1F4A8}',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${colors[element]}`}
    >
      <span>{icons[element]}</span>
      <span className="capitalize">{element}</span>
      <span className="font-bold">{value}</span>
    </span>
  );
}
