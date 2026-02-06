import { useCallback } from 'react';
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
  rarity: 'bg-rosy-granite-900/40 border-rosy-granite-400/50 text-rosy-granite-200',
  element: 'bg-mint-cream-900/40 border-mint-cream-400/50 text-mint-cream-200',
  keyword: 'bg-pacific-cyan-900/40 border-pacific-cyan-500/50 text-pacific-cyan-200',
};

const CHIP_LABEL_STYLES = {
  cost: 'text-pacific-cyan-400',
  type: 'text-sandy-brown-400',
  rarity: 'text-rosy-granite-400',
  element: 'text-mint-cream-400',
  keyword: 'text-pacific-cyan-400',
};

function ActiveFilterChips() {
  const { pageFilter, toggleFilter, clearFilters } = useDeckFilter();

  const activeEntries = Object.entries(pageFilter).filter(
    ([, v]) => v !== null,
  );
  if (activeEntries.length === 0)
    return (
      <button
        key="no-filters"
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-pacific-cyan-900/40 border border-pacific-cyan-500/50 rounded-full text-sm text-pacific-cyan-200 hover:bg-pacific-cyan-800/50 transition-colors"
      >
        No Filters
      </button>
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeEntries.map(([dimension, value]) => (
        <button
          key={dimension}
          onClick={() => toggleFilter(dimension, value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-sm hover:brightness-125 transition-colors ${CHIP_STYLES[dimension] || CHIP_STYLES.cost}`}
        >
          <span className={`font-medium ${CHIP_LABEL_STYLES[dimension] || CHIP_LABEL_STYLES.cost}`}>
            {FILTER_LABELS[dimension]}:
          </span>
          {value}
          <span className={`ml-0.5 ${CHIP_LABEL_STYLES[dimension] || CHIP_LABEL_STYLES.cost}`}>&times;</span>
        </button>
      ))}
      <button
        onClick={clearFilters}
        className="px-3 py-1 text-sm text-shadow-grey-400 hover:text-shadow-grey-200 transition-colors"
      >
        Clear All
      </button>
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
    <div className="mt-8 space-y-8">
      {/* Deck Header + Actions */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <DeckHeader />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={downloadDeckJson}
            className="px-3 py-1.5 bg-mint-cream-800/60 hover:bg-mint-cream-700/60 border border-mint-cream-600/50 rounded text-sm text-mint-cream-200 transition-colors"
          >
            Download JSON
          </button>
          <button
            onClick={() =>
              isFavorite(deck.deckId)
                ? removeFavorite(deck.deckId)
                : addFavorite(deck)
            }
            className={`px-3 py-1.5 border rounded text-sm transition-colors ${
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-shadow-grey-900 via-sandy-brown-900 to-shadow-grey-900 px-8 py-6">
          {/* Decorative glow orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-sandy-brown-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-pacific-cyan-500/10 rounded-full blur-3xl" />
          <h1 className="relative text-3xl font-bold bg-gradient-to-r from-sandy-brown-300 via-pacific-cyan-300 to-mint-cream-300 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-4xl">&#129497;</span>
            Sorcery Deck Visualizer
          </h1>
          <p className="relative mt-1 text-shadow-grey-400 text-sm">Analyze and visualize your Sorcery: Contested Realm decks</p>
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
