const ELEMENT_EMOJIS = {
  fire: { emoji: '\u{1F534}', name: 'Fire' },
  water: { emoji: '\u{1F535}', name: 'Water' },
  earth: { emoji: '\u{1F7E2}', name: 'Earth' },
  air: { emoji: '\u{1F7E1}', name: 'Air' },
};

export default function DeckHeader({ avatar, stats }) {
  // Determine primary elements (non-zero counts)
  const activeElements = Object.entries(stats.elementBreakdown)
    .filter(([el, count]) => count > 0 && el !== 'none')
    .sort(([, a], [, b]) => b - a);

  const elementSummary = activeElements
    .map(([el]) => ELEMENT_EMOJIS[el]?.name)
    .filter(Boolean)
    .join('/');

  return (
    <div className="flex gap-6 items-start">
      {/* Avatar Card */}
      {avatar && (
        <div className="flex-shrink-0">
          {avatar.imageUrl ? (
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              className="w-32 h-44 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-32 h-44 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>
      )}

      {/* Deck Info */}
      <div className="flex-1">
        {avatar && (
          <h2 className="text-2xl font-bold text-gray-100 mb-2">{avatar.name}</h2>
        )}

        {/* Avatar Stats */}
        {avatar && (
          <div className="flex gap-4 mb-4 text-lg">
            <span className="text-red-400">{avatar.life} &#10084;</span>
            <span className="text-orange-400">{avatar.attack} &#9876;</span>
            <span className="text-blue-400">{avatar.defense} &#128737;</span>
          </div>
        )}

        {/* Deck Summary */}
        <div className="bg-gray-800 rounded-lg p-4 inline-block">
          <div className="flex gap-6 text-gray-300">
            <div>
              <span className="font-bold text-xl text-gray-100">{stats.totalCards}</span>
              <span className="ml-1">cards</span>
            </div>
            <div>
              <span className="text-gray-400">Avg cost:</span>
              <span className="ml-1 font-bold text-gray-100">{stats.avgCost}</span>
            </div>
            {elementSummary && (
              <div>
                <span className="text-purple-400">{elementSummary}</span>
                <span className="ml-1 text-gray-400">deck</span>
              </div>
            )}
          </div>

          {/* Element breakdown with emojis */}
          <div className="flex gap-4 mt-3 text-sm">
            {activeElements.map(([el, count]) => (
              <span key={el} className="text-gray-400">
                {ELEMENT_EMOJIS[el]?.emoji} {ELEMENT_EMOJIS[el]?.name}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
