import { useCallback } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { useDeck } from './hooks/useDeck';
import { useFavorites } from './hooks/useFavorites';
import DeckInput from './components/DeckInput';
import DeckHeader from './components/DeckHeader';
import Favorites from './components/Favorites';
import StatsOverview from './components/StatsOverview';
import ManaCurveChart from './components/ManaCurveChart';
import ElementChart from './components/ElementChart';
import TypeChart from './components/TypeChart';
import RarityChart from './components/RarityChart';
import SynergyTags from './components/SynergyTags';
import CardList from './components/CardList';

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
          <div className="mt-8 space-y-8">
            {/* Deck Header + Actions */}
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1">
                <DeckHeader avatar={deck.avatar} stats={deck.stats} />
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
            <StatsOverview stats={deck.stats} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ManaCurveChart manaCurve={deck.stats.manaCurve} />
              <ElementChart elementBreakdown={deck.stats.elementBreakdown} />
              <TypeChart typeBreakdown={deck.stats.typeBreakdown} />
              <RarityChart rarityBreakdown={deck.stats.rarityBreakdown} />
            </div>

            {/* Synergies */}
            <SynergyTags synergies={deck.synergies} />

            {/* Card List */}
            <CardList cards={deck.cards} />
          </div>
        )}
      </div>
      <Analytics />
    </div>
  );
}

export default App;
