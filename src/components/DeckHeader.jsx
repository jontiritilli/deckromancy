import { useDeckFilter } from '../context/DeckFilterContext';
import { Element } from '../lib/enums';

const ELEMENT_EMOJIS = {
  [Element.Fire]: { emoji: '\u{1F534}', name: 'Fire', color: 'bg-[#dd7230]/15 text-[#dd7230]' },
  [Element.Water]: { emoji: '\u{1F535}', name: 'Water', color: 'bg-[#208aae]/15 text-[#208aae]' },
  [Element.Earth]: { emoji: '\u{1F7E2}', name: 'Earth', color: 'bg-[#79b791]/15 text-[#79b791]' },
  [Element.Air]: { emoji: '\u{1F7E1}', name: 'Air', color: 'bg-[#ffd131]/15 text-[#ffd131]' },
};

export default function DeckHeader({ actionButtons }) {
  const { deck, headerStats } = useDeckFilter();
  const { deckName, avatar, sourceUrl } = deck;
  const { totalCards, deckCardCount, collectionCardCount, avgCost, elementBreakdown } = headerStats;

  const activeElements = Object.entries(elementBreakdown)
    .filter(([el, count]) => count > 0 && el !== Element.None)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="section-panel-hero p-4 sm:p-6 relative">
      {/* Action buttons — top-right on desktop, full-width row below content on mobile */}
      {actionButtons && (
        <div className="sm:absolute sm:top-4 sm:right-4 md:top-6 md:right-6 flex flex-col sm:flex-row gap-2 mb-4 sm:mb-0 order-first sm:order-none">
          {actionButtons}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-start">
        {/* Avatar Card — larger with enhanced glow */}
        {avatar && (
          <div className="flex-shrink-0">
            {avatar.imageUrl ? (
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                className="w-28 h-[154px] sm:w-36 sm:h-[198px] object-cover rounded-lg ring-2 ring-sandy-brown-300 shadow-xl shadow-sandy-brown-200/40 transition-transform hover:scale-[1.02]"
              />
            ) : (
              <div className="w-28 h-[154px] sm:w-36 sm:h-[198px] bg-shadow-grey-100 rounded-lg flex items-center justify-center text-shadow-grey-400 ring-2 ring-sandy-brown-300">
                No Image
              </div>
            )}
          </div>
        )}

        {/* Deck Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          {/* Deck Name */}
          <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-shadow-grey-900 truncate">
              {deckName || avatar?.name || 'Untitled Deck'}
            </h2>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Curiosa"
                className="flex-shrink-0 text-shadow-grey-400 hover:text-sandy-brown-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.31l-5.47 5.47a.75.75 0 1 1-1.06-1.06l5.47-5.47H12.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                </svg>
              </a>
            )}
          </div>

          {/* Avatar Stats — slightly larger badges */}
          {avatar && (
            <div className="flex gap-3 mb-4 text-lg justify-center sm:justify-start">
              <span className="px-2.5 py-0.5 rounded-md bg-[#dd7230]/15 text-[#dd7230] border border-[#dd7230]/25 font-medium">{avatar.life} &#10084;</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#ffd131]/15 text-[#b89400] border border-[#ffd131]/25 font-medium">{avatar.attack} &#9876;</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#208aae]/15 text-[#208aae] border border-[#208aae]/25 font-medium">{avatar.defense} &#128737;</span>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-sandy-brown-300/50 via-shadow-grey-300/30 to-transparent mb-4" />

          {/* Stats as discrete blocks */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 justify-center sm:justify-start">
            {/* Card count */}
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] uppercase tracking-wider text-shadow-grey-500 font-medium">Cards</span>
              <span className="font-bold text-lg text-shadow-grey-900 leading-tight">
                {totalCards}
                {collectionCardCount > 0 && (
                  <span className="text-xs font-normal text-shadow-grey-500 ml-1">
                    ({deckCardCount}+{collectionCardCount})
                  </span>
                )}
              </span>
            </div>

            <div className="hidden sm:block w-px h-8 bg-shadow-grey-300/40" />

            {/* Avg cost */}
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] uppercase tracking-wider text-shadow-grey-500 font-medium">Avg Cost</span>
              <span className="font-bold text-lg text-mint-cream-600 leading-tight">{avgCost}</span>
            </div>

            {activeElements.length > 0 && (
              <div className="hidden sm:block w-px h-8 bg-shadow-grey-300/40" />
            )}

            {/* Element pills */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {activeElements.map(([el, count]) => (
                <span
                  key={el}
                  className={`px-2.5 py-1 rounded-full text-sm font-medium ${ELEMENT_EMOJIS[el]?.color || 'text-shadow-grey-500'}`}
                >
                  {ELEMENT_EMOJIS[el]?.emoji} {ELEMENT_EMOJIS[el]?.name}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
