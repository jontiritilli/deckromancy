import { useState } from 'react';

export default function Favorites({ favorites, onLoad, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  if (favorites.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-rosy-granite-400 hover:text-rosy-granite-200 transition-colors flex items-center gap-1"
      >
        <span>{expanded ? '\u25BC' : '\u25B6'}</span>
        Favorites ({favorites.length})
      </button>

      {expanded && (
        <div className="mt-2 space-y-1">
          {favorites.map((fav) => (
            <div
              key={fav.deckId}
              className="flex items-center gap-3 px-3 py-2 bg-shadow-grey-800/60 rounded-lg border border-shadow-grey-700/50 hover:border-rosy-granite-500/30 text-sm transition-colors"
            >
              <span className="flex-1 text-shadow-grey-200 truncate">{fav.name}</span>
              <span className="text-shadow-grey-500 text-xs truncate max-w-[120px]">{fav.deckId}</span>
              <button
                onClick={() => onLoad(fav.deckId)}
                className="px-2 py-0.5 bg-pacific-cyan-600 hover:bg-pacific-cyan-700 text-white rounded text-xs transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => onRemove(fav.deckId)}
                className="px-2 py-0.5 bg-shadow-grey-700 hover:bg-rosy-granite-700 text-shadow-grey-300 hover:text-rosy-granite-100 rounded text-xs transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
