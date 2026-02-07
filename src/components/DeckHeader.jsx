import { useDeckFilter } from '../context/DeckFilterContext';
import { Element } from '../lib/enums';

const ELEMENT_EMOJIS = {
  [Element.Fire]: { emoji: '\u{1F534}', name: 'Fire', color: 'bg-[#dd7230]/15 text-[#dd7230]' },
  [Element.Water]: { emoji: '\u{1F535}', name: 'Water', color: 'bg-[#208aae]/15 text-[#208aae]' },
  [Element.Earth]: { emoji: '\u{1F7E2}', name: 'Earth', color: 'bg-[#79b791]/15 text-[#79b791]' },
  [Element.Air]: { emoji: '\u{1F7E1}', name: 'Air', color: 'bg-[#ffd131]/15 text-[#ffd131]' },
};

export default function DeckHeader() {
  const { deck, headerStats } = useDeckFilter();
  const { deckName, avatar, sourceUrl } = deck;
  const { totalCards, deckCardCount, collectionCardCount, avgCost, elementBreakdown } = headerStats;

  // Determine primary elements (non-zero counts)
  const activeElements = Object.entries(elementBreakdown)
    .filter(([el, count]) => count > 0 && el !== Element.None)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="section-panel-sandy p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
      {/* Avatar Card */}
      {avatar && (
        <div className="flex-shrink-0">
          {avatar.imageUrl ? (
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              className="w-24 h-[132px] sm:w-32 sm:h-44 object-cover rounded-lg ring-2 ring-sandy-brown-500/50 shadow-lg shadow-sandy-brown-900/30"
            />
          ) : (
            <div className="w-24 h-[132px] sm:w-32 sm:h-44 bg-shadow-grey-700 rounded-lg flex items-center justify-center text-shadow-grey-500 ring-2 ring-sandy-brown-500/50">
              No Image
            </div>
          )}
        </div>
      )}

      {/* Deck Info */}
      <div className="flex-1">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-shadow-grey-50">
            {deckName || avatar?.name || 'Untitled Deck'}
          </h2>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Curiosa"
              className="text-shadow-grey-400 hover:text-sandy-brown-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.31l-5.47 5.47a.75.75 0 1 1-1.06-1.06l5.47-5.47H12.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            </a>
          )}
        </div>

        {/* Avatar Stats */}
        {avatar && (
          <div className="flex gap-3 mb-4 text-lg justify-center sm:justify-start">
            <span className="px-2 py-0.5 rounded bg-sandy-brown-900/50 text-[#dd7230]">{avatar.life} &#10084;</span>
            <span className="px-2 py-0.5 rounded bg-sandy-brown-900/50 text-[#ffd131]">{avatar.attack} &#9876;</span>
            <span className="px-2 py-0.5 rounded bg-sandy-brown-900/50 text-[#208aae]">{avatar.defense} &#128737;</span>
          </div>
        )}

        {/* Deck Summary */}
        <div className="bg-shadow-grey-900/60 rounded-lg p-3 sm:p-4">
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
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 text-sm justify-center sm:justify-start">
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
