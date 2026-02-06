import { useCallback, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useDeck } from './hooks/useDeck';
import { useFavorites } from './hooks/useFavorites';
import { DeckFilterProvider, useDeckFilter } from './context/DeckFilterContext';
import { computeStatsFromFormattedCards } from './lib/deck-analyzer';
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
};

function ActiveFilterChips() {
  const { pageFilter, toggleFilter, clearFilters } = useDeckFilter();

  const activeEntries = Object.entries(pageFilter).filter(([, v]) => v !== null);
  if (activeEntries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeEntries.map(([dimension, value]) => (
        <button
          key={dimension}
          onClick={() => toggleFilter(dimension, value)}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-900/40 border border-purple-500/50 rounded-full text-sm text-purple-200 hover:bg-purple-800/50 transition-colors"
        >
          <span className="text-purple-400 font-medium">{FILTER_LABELS[dimension]}:</span>
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

function applyPageFilter(cards, pageFilter) {
  let result = cards;

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

  return result;
}

function DeckContent({ deck, downloadDeckJson, isFavorite, addFavorite, removeFavorite }) {
  const { pageFilter } = useDeckFilter();

  const filteredStats = useMemo(() => {
    const filtered = applyPageFilter(deck.cards, pageFilter);
    return computeStatsFromFormattedCards(filtered);
  }, [deck.cards, pageFilter]);

  return (
    <div className="mt-8 space-y-8">
      {/* Deck Header + Actions */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <DeckHeader avatar={deck.avatar} stats={filteredStats} collectionCount={deck.sideboard.reduce((sum, c) => sum + c.quantity, 0)} />
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

      {/* Stats Overview */}
      <StatsOverview stats={filteredStats} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ManaCurveChart manaCurve={filteredStats.manaCurve} />
        <TypeChart
          typeBreakdown={filteredStats.typeBreakdown}
          typeElementBreakdown={filteredStats.typeElementBreakdown}
        />
        <RarityChart rarityBreakdown={filteredStats.rarityBreakdown} />
        <SiteDistributionChart
          siteElementBreakdown={filteredStats.siteElementBreakdown}
          maxThresholds={filteredStats.maxThresholds}
        />
      </div>

      {/* Active Filter Chips */}
      <ActiveFilterChips />

      {/* Synergies */}
      <SynergyTags synergies={deck.synergies} />

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
          <DeckFilterProvider resetKey={deck.deckId}>
            <DeckContent
              deck={deck}
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
