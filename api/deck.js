const CURIOSA_BASE = 'https://curiosa.io/api/trpc';
const PROCEDURES = [
  'deck.getDecklistById',
  'deck.getAvatarById',
  'deck.getSideboardById',
  'deck.getMaybeboardById',
  'deck.getById',
];

function buildCuriosaUrl(deckId) {
  const procedures = PROCEDURES.join(',');
  const input = {};
  for (let i = 0; i < PROCEDURES.length; i++) {
    input[i] = { json: { id: deckId, tracking: false } };
  }
  const encodedInput = encodeURIComponent(JSON.stringify(input));
  return `${CURIOSA_BASE}/${procedures}?batch=1&input=${encodedInput}`;
}

export default async function handler(req, res) {
  const { id: deckId } = req.query;

  if (!deckId) {
    return res.status(400).json({ error: 'Missing deck ID' });
  }

  try {
    const curiosaUrl = buildCuriosaUrl(deckId);
    const response = await fetch(curiosaUrl, {
      headers: {
        'x-trpc-source': 'nextjs-react',
        'Origin': 'https://curiosa.io',
        'Referer': `https://curiosa.io/decks/${deckId}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Curiosa API error: ${response.status}`
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
