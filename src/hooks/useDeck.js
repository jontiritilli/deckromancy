import { useState, useCallback } from 'react';
import { fetchDeckById, extractDeckId } from '../lib/deck-fetcher';
import { analyzeDeck } from '../lib/deck-analyzer';

/**
 * Custom hook for managing deck state
 * @returns {Object} Deck state and actions
 */
export function useDeck() {
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const importDeck = useCallback(async (urlOrId) => {
    setLoading(true);
    setError(null);

    try {
      // Extract deck ID from URL or use directly if already an ID
      const deckId = urlOrId.includes('/') ? extractDeckId(urlOrId) : urlOrId;

      if (!deckId) {
        throw new Error('Invalid deck URL or ID. Expected format: https://curiosa.io/decks/[deckId]');
      }

      const sourceUrl = urlOrId.includes('/') ? urlOrId : `https://curiosa.io/decks/${deckId}`;

      // Fetch deck data
      const { decklist, avatar, sideboard, maybeboard } = await fetchDeckById(deckId);

      // Analyze the deck
      const analyzedDeck = analyzeDeck(
        decklist,
        avatar,
        sideboard,
        maybeboard,
        deckId,
        sourceUrl
      );

      setDeck(analyzedDeck);
    } catch (err) {
      setError(err.message || 'Failed to import deck');
      setDeck(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearDeck = useCallback(() => {
    setDeck(null);
    setError(null);
  }, []);

  return {
    deck,
    loading,
    error,
    importDeck,
    clearDeck,
  };
}
