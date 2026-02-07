import { useCallback, useState, useRef, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useDeck } from './hooks/useDeck';
import { useFavorites } from './hooks/useFavorites';
import { DeckFilterProvider, useDeckFilter } from './context/DeckFilterContext';
import DeckInput from './components/DeckInput';
import DeckHeader from './components/DeckHeader';
import Favorites from './components/Favorites';
import StatsOverview from './components/StatsOverview';
import ManaCurveChart from './components/ManaCurveChart';
import TypeChart from './components/TypeChart';
import RarityChart from './components/RarityChart';
import SiteDistributionChart from './components/SiteDistributionChart';
import SynergyTags from './components/SynergyTags';
import ThresholdReliabilityPanel from './components/ThresholdReliabilityPanel';
import CardList from './components/CardList';

const FILTER_LABELS = {
  cost: 'Cost',
  type: 'Type',
  rarity: 'Rarity',
  element: 'Element',
  keyword: 'Keyword',
};

const CHIP_STYLES = {
  cost: 'bg-pacific-cyan-100 border-pacific-cyan-300 text-pacific-cyan-700',
  type: 'bg-sandy-brown-100 border-sandy-brown-300 text-sandy-brown-700',
  rarity:
    'bg-rosy-granite-100 border-rosy-granite-300 text-rosy-granite-700',
  element: 'bg-mint-cream-100 border-mint-cream-300 text-mint-cream-700',
  keyword:
    'bg-pacific-cyan-100 border-pacific-cyan-300 text-pacific-cyan-700',
};

const CHIP_LABEL_STYLES = {
  cost: 'text-pacific-cyan-600',
  type: 'text-sandy-brown-600',
  rarity: 'text-rosy-granite-600',
  element: 'text-mint-cream-600',
  keyword: 'text-pacific-cyan-600',
};

function FloatingFilterDrawer() {
  const {
    deck,
    pageFilter,
    toggleFilter,
    clearFilters,
    includeCollection,
    setIncludeCollection,
  } = useDeckFilter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hasCollection = deck.sideboard.length > 0;

  const activeChips = Object.entries(pageFilter).flatMap(([dimension, values]) =>
    values.map((value) => ({ dimension, value })),
  );
  const filterCount = activeChips.length;
  const hasFilters = filterCount > 0;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={ref}>
      {/* Expanded panel — opens upward */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 max-h-[60vh] overflow-auto rounded-xl border border-sandy-brown-200/60 bg-white/95 backdrop-blur shadow-xl p-3">
          <div className="flex flex-wrap items-center gap-2">
            {hasCollection && (
              <button
                onClick={() => setIncludeCollection((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-sm transition-colors ${
                  includeCollection
                    ? 'bg-sandy-brown-100 border-sandy-brown-300 text-sandy-brown-700'
                    : 'bg-white/60 border-shadow-grey-300 text-shadow-grey-500 hover:text-shadow-grey-700'
                }`}
              >
                {includeCollection ? '+ Collection' : 'Deck Only'}
              </button>
            )}
            {!hasFilters ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pacific-cyan-100 border border-pacific-cyan-300 rounded-full text-sm text-pacific-cyan-700">
                No Filters
              </span>
            ) : (
              <>
                {activeChips.map(({ dimension, value }) => (
                  <button
                    key={`${dimension}-${value}`}
                    onClick={() => toggleFilter(dimension, value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-sm hover:brightness-110 transition-colors ${
                      CHIP_STYLES[dimension] || CHIP_STYLES.cost
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        CHIP_LABEL_STYLES[dimension] || CHIP_LABEL_STYLES.cost
                      }`}
                    >
                      {FILTER_LABELS[dimension]}:
                    </span>
                    {value}
                    <span
                      className={`ml-0.5 ${
                        CHIP_LABEL_STYLES[dimension] || CHIP_LABEL_STYLES.cost
                      }`}
                    >
                      &times;
                    </span>
                  </button>
                ))}
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-sm text-shadow-grey-500 hover:text-shadow-grey-700 transition-colors"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle pill button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium shadow-lg border transition-colors ${
          hasFilters
            ? 'bg-sandy-brown-500 border-sandy-brown-600 text-white hover:bg-sandy-brown-600'
            : 'bg-white border-shadow-grey-300 text-shadow-grey-600 hover:bg-shadow-grey-50'
        }`}
      >
        Filters{hasFilters ? ` (${filterCount})` : ''}
        <span
          className={`text-[10px] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          &#9650;
        </span>
      </button>
    </div>
  );
}

function ExportDropdown({ deck, downloadDeckJson }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const tcgPlayerUrl = () => {
    const allCards = [...deck.cards, ...(deck.sideboard || [])];
    const cardParam = allCards.map((c) => `${c.quantity} ${c.name}`).join('||');
    return `https://www.tcgplayer.com/massentry?productline=Sorcery%20Contested%20Realm&c=${encodeURIComponent(
      cardParam,
    )}`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full sm:w-auto px-3 py-2 min-h-[44px] bg-mint-cream-500 hover:bg-mint-cream-600 border border-mint-cream-600 rounded text-sm text-white font-medium transition-colors flex items-center justify-center gap-1.5"
      >
        Export
        <span
          className={`text-[10px] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          &#9660;
        </span>
      </button>
      {open && (
        <div className="absolute right-0 sm:right-0 mt-1 w-full sm:w-56 bg-white border border-shadow-grey-200 rounded-lg shadow-xl z-20 overflow-hidden">
          <a
            href={tcgPlayerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block w-full px-3 py-2.5 text-left text-sm text-shadow-grey-700 hover:bg-mint-cream-50 transition-colors"
          >
            TCGplayer Mass Entry
          </a>
          <button
            onClick={() => {
              downloadDeckJson();
              setOpen(false);
            }}
            className="w-full px-3 py-2.5 text-left text-sm text-shadow-grey-700 hover:bg-mint-cream-50 transition-colors border-t border-shadow-grey-200"
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
}

function DeckContent({
  downloadDeckJson,
  isFavorite,
  addFavorite,
  removeFavorite,
}) {
  const { deck } = useDeckFilter();

  return (
    <div className="mt-6 md:mt-8 space-y-6 md:space-y-8">
      {/* Deck Header + Actions */}
      <DeckHeader
        actionButtons={
          <>
            <ExportDropdown deck={deck} downloadDeckJson={downloadDeckJson} />
            <button
              onClick={() =>
                isFavorite(deck.deckId)
                  ? removeFavorite(deck.deckId)
                  : addFavorite(deck)
              }
              className={`w-full sm:w-auto px-3 py-2 min-h-[44px] border rounded text-sm font-medium transition-colors ${
                isFavorite(deck.deckId)
                  ? 'bg-sandy-brown-500 border-sandy-brown-600 text-white'
                  : 'bg-sandy-brown-100 hover:bg-sandy-brown-200 border-sandy-brown-300 text-sandy-brown-700'
              }`}
            >
              {isFavorite(deck.deckId) ? 'Favorited' : 'Save Favorite'}
            </button>
          </>
        }
      />

      {/* Stats Overview */}
      <StatsOverview />

      <div className="divider-gradient" />

      {/* Charts — asymmetric layout */}
      <div className="space-y-6">
        <ManaCurveChart />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TypeChart />
          <RarityChart />
        </div>
        <SiteDistributionChart />
      </div>

      {/* Threshold Reliability */}
      <ThresholdReliabilityPanel />

      <div className="divider-gradient" />

      {/* Synergies */}
      <SynergyTags />

      <div className="divider-gradient" />

      {/* Card List */}
      <CardList cards={deck.cards} />

      {/* Collection (Sideboard) */}
      {deck.sideboard.length > 0 && (
        <CardList title="Collection" cards={deck.sideboard} />
      )}
    </div>
  );
}

function App() {
  const { deck, loading, error, importDeck, clearDeck, initialDeckId } =
    useDeck();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  const downloadDeckJson = useCallback(() => {
    if (!deck) return;
    const json = JSON.stringify(deck, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorcery-deck-${deck.deckId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [deck]);

  return (
    <div className="min-h-screen bg-sandy-brown-50 text-shadow-grey-800">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <header className="mb-6 md:mb-8 rounded-2xl overflow-hidden bg-white/70 border border-sandy-brown-200/60">
          <div className="flex items-center gap-4 sm:gap-5 px-5 py-4 sm:px-8 sm:py-5">
            <img
              src="/assets/images/logo-black-white.svg"
              alt="Deckromancy logo"
              className="h-10 sm:h-12 w-auto"
            />
            <div>
              <h1
                className="text-2xl sm:text-3xl font-black tracking-wide text-shadow-grey-800"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Deckromancy
              </h1>
              <p className="text-xs sm:text-sm text-shadow-grey-500 mt-0.5">
                Sorcery: Contested Realm deck analyzer
              </p>
            </div>
          </div>
          <div className="h-[2px] bg-gradient-to-r from-sandy-brown-400 via-rosy-granite-400 via-50% to-pacific-cyan-400" />
        </header>

        {/* Deck Input */}
        <div className="section-panel-sandy p-1">
          <DeckInput
            onImport={importDeck}
            onClear={clearDeck}
            loading={loading}
            hasDeck={!!deck}
            initialUrl={initialDeckId}
          />
        </div>

        {/* Favorites */}
        <Favorites
          favorites={favorites}
          onLoad={importDeck}
          onRemove={removeFavorite}
        />

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Deck Content */}
        {deck && (
          <DeckFilterProvider deck={deck}>
            <DeckContent
              downloadDeckJson={downloadDeckJson}
              isFavorite={isFavorite}
              addFavorite={addFavorite}
              removeFavorite={removeFavorite}
            />
            <FloatingFilterDrawer />
          </DeckFilterProvider>
        )}
      </div>
      <Analytics />
    </div>
  );
}

export default App;
