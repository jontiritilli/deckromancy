import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { computeStatsFromFormattedCards } from '../lib/deck-analyzer';

const DeckFilterContext = createContext(null);

const INITIAL_FILTER = { cost: [], type: [], rarity: [], element: [], keyword: [] };

function applyPageFilter(cards, pageFilter) {
  let result = cards;

  if (pageFilter.cost.length > 0) {
    result = result.filter((c) => {
      if (c.cost === null) return false;
      return pageFilter.cost.some((v) =>
        v === '7+' ? c.cost >= 7 : c.cost === Number(v),
      );
    });
  }

  if (pageFilter.type.length > 0) {
    result = result.filter((c) => pageFilter.type.includes(c.type));
  }

  if (pageFilter.rarity.length > 0) {
    result = result.filter((c) => pageFilter.rarity.includes(c.rarity));
  }

  if (pageFilter.element.length > 0) {
    result = result.filter((c) =>
      c.elements.some((el) => pageFilter.element.includes(el)),
    );
  }

  if (pageFilter.keyword.length > 0) {
    result = result.filter((c) =>
      (c.keywords || []).some((kw) => pageFilter.keyword.includes(kw)),
    );
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

  // Unfiltered stats for charts (respects includeCollection but NOT pageFilter)
  const baseStats = useMemo(() => {
    const statsCards = includeCollection
      ? [...deck.cards, ...deck.sideboard]
      : deck.cards;
    return computeStatsFromFormattedCards(statsCards);
  }, [deck.cards, deck.sideboard, includeCollection]);

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
      [dimension]: prev[dimension].includes(value)
        ? prev[dimension].filter((v) => v !== value)
        : [...prev[dimension], value],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setPageFilter(INITIAL_FILTER);
  }, []);

  return (
    <DeckFilterContext.Provider value={{ deck, pageFilter, toggleFilter, clearFilters, headerStats, baseStats, filteredStats, includeCollection, setIncludeCollection }}>
      {children}
    </DeckFilterContext.Provider>
  );
}

export function useDeckFilter() {
  const ctx = useContext(DeckFilterContext);
  if (!ctx) throw new Error('useDeckFilter must be used within a DeckFilterProvider');
  return ctx;
}
