import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const CURIOSA_BASE = 'https://curiosa.io/api/trpc';
const PROCEDURES = [
  'deck.getDecklistById',
  'deck.getAvatarById',
  'deck.getSideboardById',
  'deck.getMaybeboardById',
];

function buildCuriosaUrl(deckId) {
  const procedures = PROCEDURES.join(',');
  const input = {};
  for (let i = 0; i < 4; i++) {
    input[i] = { json: { id: deckId, tracking: false } };
  }
  const encodedInput = encodeURIComponent(JSON.stringify(input));
  return `${CURIOSA_BASE}/${procedures}?batch=1&input=${encodedInput}`;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'deck-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url.startsWith('/api/deck')) {
            return next();
          }
          const url = new URL(req.url, 'http://localhost');
          const deckId = url.searchParams.get('id');

          if (!deckId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing deck ID' }));
            return;
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
              res.statusCode = response.status;
              res.end(JSON.stringify({ error: `Curiosa API error: ${response.status}` }));
              return;
            }

            const data = await response.json();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      },
    },
  ],
});
