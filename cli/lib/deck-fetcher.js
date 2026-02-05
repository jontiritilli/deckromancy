/**
 * Fetches deck data from curiosa.io tRPC API
 */

const BASE_URL = 'https://curiosa.io/api/trpc';
const PROCEDURES = [
  'deck.getDecklistById',
  'deck.getAvatarById',
  'deck.getSideboardById',
  'deck.getMaybeboardById',
];

/**
 * Builds the tRPC batch URL for fetching deck data
 * @param {string} deckId - The deck ID
 * @returns {string} The complete API URL
 */
function buildBatchUrl(deckId) {
  const procedures = PROCEDURES.join(',');
  const input = {};
  for (let i = 0; i < 4; i++) {
    input[i] = { json: { id: deckId, tracking: false } };
  }
  const encodedInput = encodeURIComponent(JSON.stringify(input));
  return `${BASE_URL}/${procedures}?batch=1&input=${encodedInput}`;
}

/**
 * Fetches deck data by ID from curiosa.io
 * @param {string} deckId - The deck ID to fetch
 * @returns {Promise<{decklist: Array, avatar: Object, sideboard: Array, maybeboard: Array}>}
 */
export async function fetchDeckById(deckId) {
  const url = buildBatchUrl(deckId);

  const response = await fetch(url, {
    headers: {
      'x-trpc-source': 'nextjs-react',
      Origin: 'https://curiosa.io',
      Referer: `https://curiosa.io/decks/${deckId}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch deck: ${response.status} ${response.statusText}`);
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
