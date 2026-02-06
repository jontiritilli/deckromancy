import { useDeckFilter } from '../context/DeckFilterContext';
import { CardType } from '../lib/enums';

export default function StatsOverview() {
  const { filteredStats } = useDeckFilter();
  const { typeBreakdown } = filteredStats;

  const statCards = [
    {
      label: 'Minions',
      icon: '\u2694\uFE0F',
      value: typeBreakdown[CardType.Minion] || 0,
      color: 'text-[#208aae]',
      accent: 'border-t-4 border-t-pacific-cyan-500 bg-pacific-cyan-950/30',
    },
    {
      label: 'Magic',
      icon: '\u2728',
      value: typeBreakdown[CardType.Magic] || 0,
      color: 'text-[#79b791]',
      accent: 'border-t-4 border-t-mint-cream-400 bg-mint-cream-950/30',
    },
    {
      label: 'Sites',
      icon: '\u{1F3D4}\uFE0F',
      value: typeBreakdown[CardType.Site] || 0,
      color: 'text-[#dd7230]',
      accent: 'border-t-4 border-t-sandy-brown-500 bg-sandy-brown-950/30',
    },
    {
      label: 'Auras',
      icon: '\u{1F4A0}',
      value: typeBreakdown[CardType.Aura] || 0,
      color: 'text-[#ffd131]',
      accent: 'border-t-4 border-t-yellow-500 bg-yellow-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-lg p-4 text-center ${stat.accent}`}
        >
          <div className="text-lg mb-1">{stat.icon}</div>
          <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-shadow-grey-400 text-sm mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
