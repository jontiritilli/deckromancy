import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDeckFilter } from '../context/DeckFilterContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { CardType, Rarity, RARITY_ORDER } from '../lib/enums';

const ELEMENT_COLORS = {
  Fire: 'text-[#dd7230]',
  Water: 'text-[#208aae]',
  Earth: 'text-[#79b791]',
  Air: 'text-[#ffd131]',
};

const TYPE_COLORS = {
  [CardType.Minion]: 'bg-[#208aae]/20 text-[#208aae]',
  [CardType.Magic]: 'bg-[#79b791]/20 text-[#79b791]',
  [CardType.Site]: 'bg-[#dd7230]/20 text-[#dd7230]',
  [CardType.Aura]: 'bg-[#ffd131]/20 text-[#ffd131]',
  [CardType.Artifact]: 'bg-shadow-grey-700 text-shadow-grey-300',
};

const RARITY_COLORS = {
  [Rarity.Ordinary]: 'bg-shadow-grey-600/30 text-shadow-grey-300',
  [Rarity.Exceptional]: 'bg-[#79b791]/20 text-[#79b791]',
  [Rarity.Elite]: 'bg-[#208aae]/20 text-[#208aae]',
  [Rarity.Unique]: 'bg-[#ffd131]/20 text-[#ffd131]',
};

export default function CardList({ cards, title = 'Cards' }) {
  const { pageFilter } = useDeckFilter();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState({ type: '', element: '', rarity: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('tiles');
  const [previewCard, setPreviewCard] = useState(null);
  const [hover, setHover] = useState({
    visible: false,
    imageUrl: null,
    isRotated: false,
    rect: null,
  });

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

    // Page-level filters (from chart clicks)
    if (pageFilter.cost !== null) {
      result = result.filter((c) => {
        if (c.cost === null) return false;
        if (pageFilter.cost === '7+') return c.cost >= 7;
        return c.cost === Number(pageFilter.cost);
      });
    }

    if (pageFilter.type) {
      result = result.filter((c) => c.type === pageFilter.type);
    }

    if (pageFilter.rarity) {
      result = result.filter((c) => c.rarity === pageFilter.rarity);
    }

    if (pageFilter.element) {
      result = result.filter((c) => c.elements.includes(pageFilter.element));
    }

    if (pageFilter.keyword) {
      result = result.filter((c) =>
        (c.keywords || []).includes(pageFilter.keyword),
      );
    }

    // Local dropdown filters
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
  }, [cards, pageFilter, filter, sortBy, sortDir]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handleMouseEnter = useCallback((e, card) => {
    if (!card.imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHover({
      visible: true,
      imageUrl: card.imageUrl,
      isRotated: card.isRotated,
      rect,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHover({ visible: false, imageUrl: null, isRotated: false, rect: null });
  }, []);

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return (
      <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
    );
  };

  // Compute preview position anchored to thumbnail
  const previewStyle =
    hover.visible && hover.rect
      ? (() => {
          const imgW = 350;
          const imgH = 500;
          const rect = hover.rect;
          // Horizontal: try right, flip to left if needed
          let x = rect.right + 8;
          if (x + imgW > window.innerWidth) {
            x = rect.left - imgW - 8;
          }
          // Vertical: center on thumbnail, clamp to viewport
          let y = rect.top + rect.height / 2 - imgH / 2;
          if (y < 8) y = 8;
          if (y + imgH > window.innerHeight - 8)
            y = window.innerHeight - imgH - 8;
          return { left: x, top: y, width: imgW, height: imgH };
        })()
      : null;

  return (
    <div className="section-panel overflow-hidden border-t-4 border-t-rosy-granite-500/60 p-0">
      <div className="px-3 sm:px-5 py-3 sm:py-4 bg-shadow-grey-900/40">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 text-lg font-bold text-shadow-grey-100 hover:text-shadow-grey-300 transition-colors"
          >
            <span
              className={`text-sm transition-transform ${
                collapsed ? '' : 'rotate-90'
              }`}
            >
              &#9654;
            </span>
            {title} ({filteredCards.reduce((sum, c) => sum + c.quantity, 0)}{' '}
            cards, {filteredCards.length} unique)
          </button>

          {/* Filters + Copy */}
          {!collapsed && (
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full sm:w-auto min-h-[44px] py-2 px-3 bg-shadow-grey-700 border border-shadow-grey-600 border-l-2 border-l-sandy-brown-500/50 rounded text-sm text-shadow-grey-200"
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
                onChange={(e) =>
                  setFilter({ ...filter, element: e.target.value })
                }
                className="w-full sm:w-auto min-h-[44px] py-2 px-3 bg-shadow-grey-700 border border-shadow-grey-600 border-l-2 border-l-mint-cream-400/50 rounded text-sm text-shadow-grey-200"
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
                onChange={(e) =>
                  setFilter({ ...filter, rarity: e.target.value })
                }
                className="w-full sm:w-auto min-h-[44px] py-2 px-3 bg-shadow-grey-700 border border-shadow-grey-600 border-l-2 border-l-rosy-granite-400/50 rounded text-sm text-shadow-grey-200"
              >
                <option value="">All Rarities</option>
                {rarities.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Mobile view toggle + sort */}
        {!collapsed && isMobile && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex rounded overflow-hidden border border-shadow-grey-600">
              <button
                onClick={() => setViewMode('tiles')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'tiles'
                    ? 'bg-pacific-cyan-600 text-white'
                    : 'bg-shadow-grey-700 text-shadow-grey-300'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-pacific-cyan-600 text-white'
                    : 'bg-shadow-grey-700 text-shadow-grey-300'
                }`}
              >
                Table
              </button>
            </div>
            {viewMode === 'tiles' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 min-h-[36px] px-2 py-1 bg-shadow-grey-700 border border-shadow-grey-600 rounded text-xs text-shadow-grey-200"
              >
                <option value="name">Name A-Z</option>
                <option value="cost">Cost</option>
                <option value="type">Type</option>
                <option value="rarity">Rarity</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* Card Grid / Tiles */}
      {!collapsed && (
        <>
          {/* Mobile tile view */}
          {isMobile && viewMode === 'tiles' ? (
            <div className="grid grid-cols-2 gap-3 px-3 pb-4">
              {filteredCards.map((card, idx) => (
                <div
                  key={`${card.name}-${idx}`}
                  className="bg-shadow-grey-900/50 rounded-lg overflow-hidden border border-shadow-grey-700/50 active:border-pacific-cyan-500/50 transition-colors"
                  onClick={() => setPreviewCard(card)}
                >
                  {card.imageUrl ? (
                    <div
                      className={
                        card.isRotated
                          ? 'aspect-[7/5] overflow-hidden'
                          : 'aspect-[5/7] overflow-hidden'
                      }
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[5/7] bg-shadow-grey-700 flex items-center justify-center text-shadow-grey-500 text-xs">
                      No Image
                    </div>
                  )}
                  <div className="p-2">
                    <div className="text-xs font-medium text-shadow-grey-200 truncate">
                      {card.name}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          TYPE_COLORS[card.type] ||
                          'bg-shadow-grey-700 text-shadow-grey-300'
                        }`}
                      >
                        {card.type}
                      </span>
                      <span className="text-[10px] text-shadow-grey-400">
                        x{card.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table view (desktop always, mobile when toggled) */
            <div className="overflow-x-auto px-3 sm:px-5 pb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-shadow-grey-300 border-b-2 border-shadow-grey-600">
                    <th className="pb-2 pr-4">Image</th>
                    <th
                      className="pb-2 pr-4 cursor-pointer hover:text-shadow-grey-200"
                      onClick={() => handleSort('name')}
                    >
                      Name <SortIcon column="name" />
                    </th>
                    <th
                      className="pb-2 pr-4 cursor-pointer hover:text-shadow-grey-200"
                      onClick={() => handleSort('type')}
                    >
                      Type <SortIcon column="type" />
                    </th>
                    <th
                      className="pb-2 pr-4 cursor-pointer hover:text-shadow-grey-200"
                      onClick={() => handleSort('cost')}
                    >
                      Cost <SortIcon column="cost" />
                    </th>
                    <th
                      className="pb-2 pr-4 cursor-pointer hover:text-shadow-grey-200"
                      onClick={() => handleSort('rarity')}
                    >
                      Rarity <SortIcon column="rarity" />
                    </th>
                    <th className="pb-2 pr-4">Elements</th>
                    <th
                      className="pb-2 cursor-pointer hover:text-shadow-grey-200"
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
                      className="border-b border-shadow-grey-700/50 hover:bg-rosy-granite-900/20 even:bg-shadow-grey-900/30 cursor-pointer"
                      onClick={() => setPreviewCard(card)}
                    >
                      <td className="py-2 pr-4 flex items-center justify-center">
                        {card.imageUrl ? (
                          <div
                            className={`overflow-hidden rounded ${
                              card.isRotated
                                ? 'w-12 h-16 rotate-90'
                                : 'w-12 h-16'
                            }`}
                          >
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-full h-full object-cover cursor-zoom-in"
                              loading="lazy"
                              onMouseEnter={
                                isMobile
                                  ? undefined
                                  : (e) => handleMouseEnter(e, card)
                              }
                              onMouseLeave={
                                isMobile ? undefined : handleMouseLeave
                              }
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-16 bg-shadow-grey-700 rounded flex items-center justify-center text-xs text-shadow-grey-500">
                            ?
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4 font-medium text-shadow-grey-200">
                        {card.name}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            TYPE_COLORS[card.type] ||
                            'bg-shadow-grey-700 text-shadow-grey-300'
                          }`}
                        >
                          {card.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-shadow-grey-300">
                        {card.cost !== null ? card.cost : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            RARITY_COLORS[card.rarity] ||
                            'bg-shadow-grey-700 text-shadow-grey-300'
                          }`}
                        >
                          {card.rarity || '-'}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-1">
                          {card.elements.map((el) => (
                            <span
                              key={el}
                              className={`text-xs ${
                                ELEMENT_COLORS[el] || 'text-shadow-grey-400'
                              }`}
                            >
                              {el}
                            </span>
                          ))}
                          {card.elements.length === 0 && (
                            <span className="text-xs text-shadow-grey-500">
                              -
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-shadow-grey-300 font-medium">
                        x{card.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Desktop Card Hover Preview — portaled to body to escape overflow-hidden / backdrop-blur containing block */}
      {!isMobile &&
        hover.visible &&
        hover.imageUrl &&
        previewStyle &&
        createPortal(
          <div className="fixed z-50 pointer-events-none" style={previewStyle}>
            <img
              src={hover.imageUrl}
              alt="Card preview"
              className={`w-full h-full object-cover rounded-lg shadow-2xl border border-pacific-cyan-600/30 shadow-pacific-cyan-900/30 ${
                hover.isRotated ? 'rotate-90' : ''
              }`}
            />
          </div>,
          document.body,
        )}

      {/* Card Detail Modal — portaled to body */}
      {previewCard &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewCard(null)}
          >
            <div
              className="relative bg-shadow-grey-800 border border-shadow-grey-600 rounded-xl shadow-2xl max-h-[90vh] max-w-2xl w-full overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewCard(null)}
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-shadow-grey-700 hover:bg-shadow-grey-600 border border-shadow-grey-500 rounded-full flex items-center justify-center text-shadow-grey-200 text-lg leading-none transition-colors"
              >
                &times;
              </button>

              <div className="p-4">
                <div className="flex gap-4 mb-3">
                  {previewCard.imageUrl && (
                    <div className="shrink-0 w-80 h-80 flex items-center justify-center overflow-hidden rounded-lg">
                      <img
                        src={previewCard.imageUrl}
                        alt={previewCard.name}
                        className={`max-h-full max-w-full rounded-lg ${
                          previewCard.isRotated ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-shadow-grey-50 leading-tight">
                        {previewCard.name}
                      </h3>
                      <span className="text-sm text-shadow-grey-400 shrink-0">
                        x{previewCard.quantity}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          TYPE_COLORS[previewCard.type] ||
                          'bg-shadow-grey-700 text-shadow-grey-300'
                        }`}
                      >
                        {previewCard.type}
                      </span>
                      {previewCard.cost !== null && (
                        <span className="px-2 py-0.5 rounded text-xs bg-pacific-cyan-900/40 text-pacific-cyan-200">
                          Cost {previewCard.cost}
                        </span>
                      )}
                      {previewCard.rarity && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            RARITY_COLORS[previewCard.rarity] ||
                            'bg-shadow-grey-700 text-shadow-grey-300'
                          }`}
                        >
                          {previewCard.rarity}
                        </span>
                      )}
                    </div>

                    {previewCard.elements.length > 0 && (
                      <div className="flex gap-2">
                        {previewCard.elements.map((el) => (
                          <span
                            key={el}
                            className={`text-sm font-medium ${
                              ELEMENT_COLORS[el] || 'text-shadow-grey-400'
                            }`}
                          >
                            {el}
                          </span>
                        ))}
                      </div>
                    )}

                    {(previewCard.fireThreshold > 0 ||
                      previewCard.waterThreshold > 0 ||
                      previewCard.earthThreshold > 0 ||
                      previewCard.airThreshold > 0) && (
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {previewCard.fireThreshold > 0 && (
                          <span className="px-2 py-0.5 rounded bg-[#dd7230]/15 text-[#dd7230]">
                            Fire {previewCard.fireThreshold}
                          </span>
                        )}
                        {previewCard.waterThreshold > 0 && (
                          <span className="px-2 py-0.5 rounded bg-[#208aae]/15 text-[#208aae]">
                            Water {previewCard.waterThreshold}
                          </span>
                        )}
                        {previewCard.earthThreshold > 0 && (
                          <span className="px-2 py-0.5 rounded bg-[#79b791]/15 text-[#79b791]">
                            Earth {previewCard.earthThreshold}
                          </span>
                        )}
                        {previewCard.airThreshold > 0 && (
                          <span className="px-2 py-0.5 rounded bg-[#ffd131]/15 text-[#ffd131]">
                            Air {previewCard.airThreshold}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rules text */}
                {previewCard.rulesText && (
                  <p className="text-sm text-shadow-grey-300 leading-relaxed whitespace-pre-line border-t border-shadow-grey-700 pt-3 mt-3">
                    {previewCard.rulesText}
                  </p>
                )}

                {/* Keywords */}
                {previewCard.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-shadow-grey-700 pt-3 mt-3">
                    {previewCard.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-full text-xs bg-rosy-granite-900/50 border border-rosy-granite-500/30 text-rosy-granite-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
