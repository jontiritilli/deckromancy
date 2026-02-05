import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sorcery-favorites';

function readFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  const addFavorite = useCallback((deck) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.deckId === deck.deckId)) return prev;
      const next = [...prev, {
        deckId: deck.deckId,
        name: deck.avatar?.name || deck.deckId,
        savedAt: new Date().toISOString(),
      }];
      writeFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((deckId) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.deckId !== deckId);
      writeFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((deckId) => {
    return favorites.some((f) => f.deckId === deckId);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
