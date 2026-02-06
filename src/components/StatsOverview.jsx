export default function StatsOverview({ stats }) {
  const { typeBreakdown } = stats;

  const statCards = [
    {
      label: 'Minions',
      value: typeBreakdown.Minion || 0,
      color: 'text-purple-400',
    },
    {
      label: 'Magic',
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
    </div>
  );
}
