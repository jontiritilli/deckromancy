import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DeckFilterContext = createContext(null);

const INITIAL_FILTER = { cost: null, type: null, rarity: null, element: null };

export function DeckFilterProvider({ resetKey, children }) {
  const [pageFilter, setPageFilter] = useState(INITIAL_FILTER);

  // Reset filters when the deck changes
  useEffect(() => {
    setPageFilter(INITIAL_FILTER);
  }, [resetKey]);

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
    <DeckFilterContext.Provider value={{ pageFilter, toggleFilter, clearFilters }}>
      {children}
    </DeckFilterContext.Provider>
  );
}

export function useDeckFilter() {
  const ctx = useContext(DeckFilterContext);
  if (!ctx) throw new Error('useDeckFilter must be used within a DeckFilterProvider');
  return ctx;
}
