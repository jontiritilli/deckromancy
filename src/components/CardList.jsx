import { useState, useMemo, useCallback } from 'react';

const ELEMENT_COLORS = {
  Fire: 'text-red-400',
  Water: 'text-blue-400',
  Earth: 'text-green-400',
  Air: 'text-yellow-400',
};

const TYPE_COLORS = {
  Minion: 'bg-purple-900/30 text-purple-300',
  Magic: 'bg-cyan-900/30 text-cyan-300',
  Site: 'bg-amber-900/30 text-amber-300',
  Aura: 'bg-pink-900/30 text-pink-300',
  Artifact: 'bg-gray-700 text-gray-300',
};

const RARITY_COLORS = {
  Ordinary: 'bg-gray-600/30 text-gray-300',
  Exceptional: 'bg-blue-900/30 text-blue-300',
  Elite: 'bg-purple-900/30 text-purple-300',
  Unique: 'bg-amber-900/30 text-amber-300',
};

const RARITY_ORDER = ['Ordinary', 'Exceptional', 'Elite', 'Unique'];

export default function CardList({ cards }) {
  const [filter, setFilter] = useState({ type: '', element: '', rarity: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState({ visible: false, imageUrl: null, x: 0, y: 0 });

  // Get unique types, elements, and rarities for filter options
  const types = useMemo(() => {
    const set = new Set(cards.map((c) => c.type));
    return Array.from(set).sort();
  }, [cards]);

  const elements = useMemo(() => {
    const set = new Set(cards.flatMap((c) => c.elements));
    return Array.from(set).sort();
  }, [cards]);

  const rarities = useMemo(() => {
    const set = new Set(cards.map((c) => c.rarity).filter(Boolean));
    return RARITY_ORDER.filter((r) => set.has(r));
  }, [cards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let result = cards;

    if (filter.type) {
      result = result.filter((c) => c.type === filter.type);
    }

    if (filter.element) {
      result = result.filter((c) => c.elements.includes(filter.element));
    }

    if (filter.rarity) {
      result = result.filter((c) => c.rarity === filter.rarity);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === 'cost') {
        cmp = (a.cost ?? -1) - (b.cost ?? -1);
      } else if (sortBy === 'type') {
        cmp = a.type.localeCompare(b.type);
      } else if (sortBy === 'rarity') {
        cmp = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      } else if (sortBy === 'quantity') {
        cmp = a.quantity - b.quantity;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [cards, filter, sortBy, sortDir]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const copyTcgList = useCallback(() => {
    const lines = filteredCards.map((c) => `${c.quantity} ${c.name}`).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [filteredCards]);

  const handleMouseEnter = useCallback((e, card) => {
    if (!card.imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHover({
      visible: true,
      imageUrl: card.imageUrl,
      x: rect.right + 8,
      y: rect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHover({ visible: false, imageUrl: null, x: 0, y: 0 });
  }, []);

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
  };

  // Compute preview position avoiding off-screen
  const previewStyle = hover.visible
    ? (() => {
        const imgW = 200;
        const imgH = 280;
        let x = hover.x;
        let y = hover.y;
        if (x + imgW > window.innerWidth) {
          x = hover.x - imgW - 16;
        }
        if (y + imgH > window.innerHeight) {
          y = window.innerHeight - imgH - 8;
        }
        if (y < 0) y = 8;
        return { left: x, top: y, width: imgW, height: imgH };
      })()
    : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h3 className="text-lg font-bold text-gray-100">
          Cards ({filteredCards.length})
        </h3>

        {/* Filters + Copy */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={filter.element}
            onChange={(e) => setFilter({ ...filter, element: e.target.value })}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
          >
            <option value="">All Elements</option>
            {elements.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <select
            value={filter.rarity}
            onChange={(e) => setFilter({ ...filter, rarity: e.target.value })}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
          >
            <option value="">All Rarities</option>
            {rarities.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            onClick={copyTcgList}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-sm text-gray-200 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy List'}
          </button>
        </div>
      </div>

      {/* Card Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="pb-2 pr-4">Image</th>
              <th
                className="pb-2 pr-4 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('name')}
              >
                Name <SortIcon column="name" />
              </th>
              <th
                className="pb-2 pr-4 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('type')}
              >
                Type <SortIcon column="type" />
              </th>
              <th
                className="pb-2 pr-4 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('cost')}
              >
                Cost <SortIcon column="cost" />
              </th>
              <th
                className="pb-2 pr-4 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('rarity')}
              >
                Rarity <SortIcon column="rarity" />
              </th>
              <th className="pb-2 pr-4">Elements</th>
              <th
                className="pb-2 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('quantity')}
              >
                Qty <SortIcon column="quantity" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map((card, idx) => (
              <tr
                key={`${card.name}-${idx}`}
                className="border-b border-gray-700/50 hover:bg-gray-700/30"
              >
                <td className="py-2 pr-4">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-12 h-16 object-cover rounded cursor-zoom-in"
                      loading="lazy"
                      onMouseEnter={(e) => handleMouseEnter(e, card)}
                      onMouseLeave={handleMouseLeave}
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500">
                      ?
                    </div>
                  )}
                </td>
                <td className="py-2 pr-4 font-medium text-gray-200">
                  {card.name}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${TYPE_COLORS[card.type] || 'bg-gray-700 text-gray-300'}`}
                  >
                    {card.type}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-300">
                  {card.cost !== null ? card.cost : '-'}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${RARITY_COLORS[card.rarity] || 'bg-gray-700 text-gray-300'}`}
                  >
                    {card.rarity || '-'}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex gap-1">
                    {card.elements.map((el) => (
                      <span key={el} className={`text-xs ${ELEMENT_COLORS[el] || 'text-gray-400'}`}>
                        {el}
                      </span>
                    ))}
                    {card.elements.length === 0 && (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </div>
                </td>
                <td className="py-2 text-gray-300 font-medium">
                  x{card.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card Hover Preview */}
      {hover.visible && hover.imageUrl && previewStyle && (
        <div
          className="fixed z-50 pointer-events-none"
          style={previewStyle}
        >
          <img
            src={hover.imageUrl}
            alt="Card preview"
            className="w-full h-full object-cover rounded-lg shadow-2xl border border-gray-600"
          />
        </div>
      )}
    </div>
  );
}
