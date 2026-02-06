import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { computeStatsFromFormattedCards } from '../lib/deck-analyzer';

const DeckFilterContext = createContext(null);

const INITIAL_FILTER = { cost: null, type: null, rarity: null, element: null, keyword: null };

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

  if (pageFilter.keyword) {
    result = result.filter((c) => (c.keywords || []).includes(pageFilter.keyword));
  }

  return result;
}

export function DeckFilterProvider({ deck, children }) {
  const [pageFilter, setPageFilter] = useState(INITIAL_FILTER);
  const [includeCollection, setIncludeCollection] = useState(false);

  // Reset filters when the deck changes
  useEffect(() => {
    setPageFilter(INITIAL_FILTER);
    setIncludeCollection(false);
  }, [deck.deckId]);

  // Always-inclusive stats for the header (deck + collection, ignores includeCollection toggle)
  const headerStats = useMemo(() => {
    const allCards = [...deck.cards, ...deck.sideboard];
    const stats = computeStatsFromFormattedCards(allCards);
    const deckCardCount = deck.cards.reduce((sum, c) => sum + c.quantity, 0);
    const collectionCardCount = deck.sideboard.reduce((sum, c) => sum + c.quantity, 0);
    return { ...stats, deckCardCount, collectionCardCount };
  }, [deck.cards, deck.sideboard]);

  // Stats for everything below the header (respects includeCollection + page filters)
  const filteredStats = useMemo(() => {
    const filteredDeck = applyPageFilter(deck.cards, pageFilter);
    const filteredSideboard = applyPageFilter(deck.sideboard, pageFilter);
    const statsCards = includeCollection
      ? [...filteredDeck, ...filteredSideboard]
      : filteredDeck;
    const stats = computeStatsFromFormattedCards(statsCards);
    return {
      ...stats,
      deckCardCount: filteredDeck.reduce((sum, c) => sum + c.quantity, 0),
      collectionCardCount: includeCollection
        ? filteredSideboard.reduce((sum, c) => sum + c.quantity, 0)
        : 0,
    };
  }, [deck.cards, deck.sideboard, pageFilter, includeCollection]);

  const toggleFilter = useCallback((dimension, value) => {
    setPageFilter((prev) => ({
      ...prev,
      [dimension]: prev[dimension] === value ? null : value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setPageFilter(INITIAL_FILTER);
  }, []);

  return (
    <DeckFilterContext.Provider value={{ deck, pageFilter, toggleFilter, clearFilters, headerStats, filteredStats, includeCollection, setIncludeCollection }}>
      {children}
    </DeckFilterContext.Provider>
  );
}

export function useDeckFilter() {
  const ctx = useContext(DeckFilterContext);
  if (!ctx) throw new Error('useDeckFilter must be used within a DeckFilterProvider');
  return ctx;
}
