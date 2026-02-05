import { useState } from 'react';

export default function Favorites({ favorites, onLoad, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  if (favorites.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
      >
        <span>{expanded ? '\u25BC' : '\u25B6'}</span>
        Favorites ({favorites.length})
      </button>

      {expanded && (
        <div className="mt-2 space-y-1">
          {favorites.map((fav) => (
            <div
              key={fav.deckId}
              className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded text-sm"
            >
              <span className="flex-1 text-gray-200 truncate">{fav.name}</span>
              <span className="text-gray-500 text-xs truncate max-w-[120px]">{fav.deckId}</span>
              <button
                onClick={() => onLoad(fav.deckId)}
                className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => onRemove(fav.deckId)}
                className="px-2 py-0.5 bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white rounded text-xs transition-colors"
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
