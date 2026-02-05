/**
 * Fetches deck data from curiosa.io via local server endpoint
 */

/**
 * Fetches deck data by ID from curiosa.io
 * @param {string} deckId - The deck ID to fetch
 * @returns {Promise<{decklist: Array, avatar: Object, sideboard: Array, maybeboard: Array}>}
 */
export async function fetchDeckById(deckId) {
  const response = await fetch(`/api/deck?id=${encodeURIComponent(deckId)}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch deck: ${response.status}`);
  }

  const data = await response.json();

  // Extract results from batched response
  // Index 0: decklist, 1: avatar, 2: sideboard, 3: maybeboard
  const decklist = data[0]?.result?.data?.json ?? [];
  const avatarData = data[1]?.result?.data?.json;
  const sideboard = data[2]?.result?.data?.json ?? [];
  const maybeboard = data[3]?.result?.data?.json ?? [];

  // Avatar comes wrapped in a single object, not an array
  const avatar = avatarData?.card ?? null;

  return {
    decklist,
    avatar,
    sideboard,
    maybeboard,
  };
}

/**
 * Extracts deck ID from a curiosa.io URL
 * @param {string} url - The curiosa.io deck URL
 * @returns {string|null} The deck ID or null if not found
 */
export function extractDeckId(url) {
  const match = url.match(/\/decks\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}
