import { useDeckFilter } from '../context/DeckFilterContext';

const ELEMENT_EMOJIS = {
  fire: { emoji: '\u{1F534}', name: 'Fire', color: 'bg-[#dd7230]/15 text-[#dd7230]' },
  water: { emoji: '\u{1F535}', name: 'Water', color: 'bg-[#208aae]/15 text-[#208aae]' },
  earth: { emoji: '\u{1F7E2}', name: 'Earth', color: 'bg-[#79b791]/15 text-[#79b791]' },
  air: { emoji: '\u{1F7E1}', name: 'Air', color: 'bg-[#ffd131]/15 text-[#ffd131]' },
};

export default function DeckHeader() {
  const { deck, filteredStats } = useDeckFilter();
  const { deckName, avatar } = deck;
  const { totalCards, deckCardCount, collectionCardCount, avgCost, elementBreakdown } = filteredStats;

  // Determine primary elements (non-zero counts)
  const activeElements = Object.entries(elementBreakdown)
    .filter(([el, count]) => count > 0 && el !== 'none')
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="section-panel-sandy p-6 flex gap-6 items-start">
      {/* Avatar Card */}
      {avatar && (
        <div className="flex-shrink-0">
          {avatar.imageUrl ? (
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              className="w-32 h-44 object-cover rounded-lg ring-2 ring-sandy-brown-500/50 shadow-lg shadow-sandy-brown-900/30"
            />
          ) : (
            <div className="w-32 h-44 bg-shadow-grey-700 rounded-lg flex items-center justify-center text-shadow-grey-500 ring-2 ring-sandy-brown-500/50">
              No Image
            </div>
          )}
        </div>
      )}

      {/* Deck Info */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-shadow-grey-50 mb-2">
          {deckName || avatar?.name || 'Untitled Deck'}
        </h2>

        {/* Avatar Stats */}
        {avatar && (
          <div className="flex gap-3 mb-4 text-lg">
            <span className="px-2 py-0.5 rounded bg-sandy-brown-900/50 text-[#dd7230]">{avatar.life} &#10084;</span>
            <span className="px-2 py-0.5 rounded bg-sandy-brown-900/50 text-[#ffd131]">{avatar.attack} &#9876;</span>
            <span className="px-2 py-0.5 rounded bg-sandy-brown-900/50 text-[#208aae]">{avatar.defense} &#128737;</span>
          </div>
        )}

        {/* Deck Summary */}
        <div className="bg-shadow-grey-900/60 rounded-lg p-4 inline-block">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-shadow-grey-300">
            <div>
              <span className="font-bold text-xl text-shadow-grey-100">
                {totalCards}
              </span>
              <span className="ml-1">cards</span>
              {collectionCardCount > 0 && (
                <span className="ml-1 text-shadow-grey-400">
                  ({deckCardCount} deck, {collectionCardCount} collection)
                </span>
              )}
            </div>
            <div>
              <span className="text-shadow-grey-400">Avg cost:</span>
              <span className="ml-1 font-bold text-shadow-grey-100">
                {avgCost}
              </span>
            </div>
          </div>

          {/* Element breakdown with emojis */}
          <div className="flex gap-3 mt-3 text-sm">
            {activeElements.map(([el, count]) => (
              <span key={el} className={`px-2 py-0.5 rounded ${ELEMENT_EMOJIS[el]?.color || 'text-shadow-grey-400'}`}>
                {ELEMENT_EMOJIS[el]?.emoji} {ELEMENT_EMOJIS[el]?.name}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
