import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'node:https';

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

function fetchCuriosa(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, rejectUnauthorized: false }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, body });
      });
    });
    req.on('error', reject);
  });
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
            const response = await fetchCuriosa(curiosaUrl, {
              'x-trpc-source': 'nextjs-react',
              'Origin': 'https://curiosa.io',
              'Referer': `https://curiosa.io/decks/${deckId}`,
            });

            if (!response.ok) {
              res.statusCode = response.status;
              res.end(JSON.stringify({ error: `Curiosa API error: ${response.status}` }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(response.body);
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      },
    },
  ],
});
