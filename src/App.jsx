import { useDeck } from './hooks/useDeck';
import DeckInput from './components/DeckInput';
import DeckHeader from './components/DeckHeader';
import StatsOverview from './components/StatsOverview';
import ManaCurveChart from './components/ManaCurveChart';
import ElementChart from './components/ElementChart';
import TypeChart from './components/TypeChart';
import RarityChart from './components/RarityChart';
import SynergyTags from './components/SynergyTags';
import CardList from './components/CardList';

function App() {
  const { deck, loading, error, importDeck, clearDeck } = useDeck();

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
            {/* Deck Header */}
            <DeckHeader avatar={deck.avatar} stats={deck.stats} />

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
    </div>
  );
}

export default App;
