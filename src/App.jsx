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
  cost: 'bg-pacific-cyan-900/40 border-pacific-cyan-500/50 text-pacific-cyan-200',
  type: 'bg-sandy-brown-900/40 border-sandy-brown-500/50 text-sandy-brown-200',
  rarity:
    'bg-rosy-granite-900/40 border-rosy-granite-400/50 text-rosy-granite-200',
  element: 'bg-mint-cream-900/40 border-mint-cream-400/50 text-mint-cream-200',
  keyword:
    'bg-pacific-cyan-900/40 border-pacific-cyan-500/50 text-pacific-cyan-200',
};

const CHIP_LABEL_STYLES = {
  cost: 'text-pacific-cyan-400',
  type: 'text-sandy-brown-400',
  rarity: 'text-rosy-granite-400',
  element: 'text-mint-cream-400',
  keyword: 'text-pacific-cyan-400',
};

function ActiveFilterChips() {
  const { deck, pageFilter, toggleFilter, clearFilters, includeCollection, setIncludeCollection } = useDeckFilter();
  const hasCollection = deck.sideboard.length > 0;

  const activeEntries = Object.entries(pageFilter).filter(
    ([, v]) => v !== null,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasCollection && (
        <button
          onClick={() => setIncludeCollection((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-sm transition-colors ${
            includeCollection
              ? 'bg-sandy-brown-900/40 border-sandy-brown-500/50 text-sandy-brown-200'
              : 'bg-shadow-grey-800/60 border-shadow-grey-600 text-shadow-grey-400 hover:text-shadow-grey-200'
          }`}
        >
          {includeCollection ? '+ Collection' : 'Deck Only'}
        </button>
      )}
      {activeEntries.length === 0 ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pacific-cyan-900/40 border border-pacific-cyan-500/50 rounded-full text-sm text-pacific-cyan-200">
          No Filters
        </span>
      ) : (
        <>
          {activeEntries.map(([dimension, value]) => (
            <button
              key={dimension}
              onClick={() => toggleFilter(dimension, value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-sm hover:brightness-125 transition-colors ${
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
            className="px-3 py-1 text-sm text-shadow-grey-400 hover:text-shadow-grey-200 transition-colors"
          >
            Clear All
          </button>
        </>
      )}
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
        className="w-full sm:w-auto px-3 py-2 min-h-[44px] bg-mint-cream-800/60 hover:bg-mint-cream-700/60 border border-mint-cream-600/50 rounded text-sm text-mint-cream-200 transition-colors flex items-center justify-center gap-1.5"
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
        <div className="absolute right-0 sm:right-0 mt-1 w-full sm:w-56 bg-shadow-grey-800 border border-shadow-grey-600 rounded-lg shadow-xl z-20 overflow-hidden">
          <a
            href={tcgPlayerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block w-full px-3 py-2.5 text-left text-sm text-shadow-grey-200 hover:bg-shadow-grey-700 transition-colors"
          >
            TCGplayer Mass Entry
          </a>
          <button
            onClick={() => {
              downloadDeckJson();
              setOpen(false);
            }}
            className="w-full px-3 py-2.5 text-left text-sm text-shadow-grey-200 hover:bg-shadow-grey-700 transition-colors border-t border-shadow-grey-700"
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
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <DeckHeader />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-1 w-full sm:w-auto">
          <ExportDropdown deck={deck} downloadDeckJson={downloadDeckJson} />
          <button
            onClick={() =>
              isFavorite(deck.deckId)
                ? removeFavorite(deck.deckId)
                : addFavorite(deck)
            }
            className={`w-full sm:w-auto px-3 py-2 min-h-[44px] border rounded text-sm transition-colors ${
              isFavorite(deck.deckId)
                ? 'bg-sandy-brown-600 border-sandy-brown-500 text-sandy-brown-50'
                : 'bg-sandy-brown-800/60 hover:bg-sandy-brown-700/60 border-sandy-brown-600/50 text-sandy-brown-200'
            }`}
          >
            {isFavorite(deck.deckId) ? 'Favorited' : 'Save Favorite'}
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      <ActiveFilterChips />

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
    <div className="min-h-screen bg-shadow-grey-950 text-shadow-grey-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <header className="mb-6 md:mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-shadow-grey-900 via-sandy-brown-900 to-shadow-grey-900 px-4 py-4 sm:px-8 sm:py-6">
          {/* Decorative glow orbs */}
          <div className="hidden sm:block absolute top-0 left-1/4 w-64 h-64 bg-sandy-brown-500/10 rounded-full blur-3xl" />
          <div className="hidden sm:block absolute bottom-0 right-1/4 w-48 h-48 bg-pacific-cyan-500/10 rounded-full blur-3xl" />
          <h1 className="relative text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sandy-brown-300 via-pacific-cyan-300 to-mint-cream-300 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-3xl sm:text-4xl">&#129497;</span>
            Sorcery Deck Visualizer
          </h1>
          <p className="relative mt-1 text-shadow-grey-400 text-sm">
            Analyze and visualize your Sorcery: Contested Realm decks
          </p>
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
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
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
          </DeckFilterProvider>
        )}
      </div>
      <Analytics />
    </div>
  );
}

export default App;
