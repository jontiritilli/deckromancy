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

function ActiveFilterChips() {
  const { pageFilter, toggleFilter, clearFilters } = useDeckFilter();

  const activeEntries = Object.entries(pageFilter).filter(
    ([, v]) => v !== null,
  );
  if (activeEntries.length === 0)
    return (
      <button
        key="no-filters"
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-900/40 border border-purple-500/50 rounded-full text-sm text-purple-200 hover:bg-purple-800/50 transition-colors"
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
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-900/40 border border-purple-500/50 rounded-full text-sm text-purple-200 hover:bg-purple-800/50 transition-colors"
        >
          <span className="text-purple-400 font-medium">
            {FILTER_LABELS[dimension]}:
          </span>
          {value}
          <span className="ml-0.5 text-purple-400">&times;</span>
        </button>
      ))}
      <button
        onClick={clearFilters}
        className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
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
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-sm text-gray-200 transition-colors"
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
                ? 'bg-amber-700 hover:bg-amber-800 border-amber-600 text-amber-100'
                : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200'
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ManaCurveChart />
        <TypeChart />
        <RarityChart />
        <SiteDistributionChart />
      </div>

      {/* Synergies */}
      <SynergyTags />

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
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-400 flex items-center gap-2">
            <span className="text-4xl">&#129497;</span>
            Sorcery Deck Visualizer
          </h1>
        </header>

        {/* Deck Input */}
        <DeckInput
          onImport={importDeck}
          onClear={clearDeck}
          loading={loading}
          hasDeck={!!deck}
          initialUrl={initialDeckId}
        />

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
