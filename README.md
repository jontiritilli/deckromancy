# Sorcery Collection Manager

A Node.js CLI for managing Sorcery TCG card collections and decks. Fetch decks from curiosa.io, analyze card synergies, and filter your collection.

## Features

- **Deck Fetching** - Import decks directly from curiosa.io URLs
- **Deck Analysis** - Mana curves, element breakdowns, keyword extraction, theme detection
- **Collection Filtering** - Extract cards with quantity > 0 from collections or decks
- **Set Comparison** - Find cards in your collection that aren't in a specific deck

## Prerequisites

- Node.js 18+ (uses native fetch)

## CLI Usage

### fetch-deck

Fetch and analyze a deck from curiosa.io:

```bash
node cli.js fetch-deck <deck-url>
```

Example:

```bash
node cli.js fetch-deck https://curiosa.io/decks/cmjno8n062dht6bfopd0kegs0
```

Output is JSON to stdout, making it pipeable:

```bash
# Extract just the stats
node cli.js fetch-deck <url> | jq '.stats'

# View the mana curve
node cli.js fetch-deck <url> | jq '.stats.manaCurve'

# List cards with specific keywords
node cli.js fetch-deck <url> | jq '.cards[] | select(.keywords | index("Genesis"))'

# Save to file
node cli.js fetch-deck <url> > output/my-deck.json
```

### filter

Filter a collection or deck file to items with quantity > 0:

```bash
npm run filter
```

Edit the `main()` function in `filter.js` to specify your input file.

## Deck Analysis Output

The `fetch-deck` command produces JSON with:

```json
{
  "deckId": "cmjno8n062dht6bfopd0kegs0",
  "sourceUrl": "https://curiosa.io/decks/...",
  "fetchedAt": "2026-02-05T...",
  "avatar": {
    "name": "Necromancer",
    "rulesText": "Tap → Play or draw a site...",
    "life": 20,
    "attack": 1,
    "defense": 1
  },
  "stats": {
    "totalCards": 52,
    "avgCost": 2.86,
    "manaCurve": { "0": 0, "1": 8, "2": 6, "3": 10, "4": 10, "5": 0, "6": 1, "7+": 1 },
    "elementBreakdown": { "fire": 34, "water": 0, "earth": 0, "air": 19, "none": 1 },
    "maxThresholds": { "fire": 3, "water": 0, "earth": 0, "air": 2 },
    "typeBreakdown": { "Site": 16, "Magic": 13, "Minion": 22, "Aura": 1 },
    "rarityBreakdown": { "Ordinary": 34, "Exceptional": 12, "Elite": 5, "Unique": 1 }
  },
  "synergies": {
    "keywords": { "Genesis": 19, "damage": 13, "nearby": 12 },
    "themes": ["tokens", "sacrifice", "control"]
  },
  "cards": [...],
  "sideboard": [],
  "maybeboard": []
}
```

### Keyword Detection

Cards are tagged with keywords from their rules text:

| Category | Keywords |
|----------|----------|
| Triggers | Genesis, Arrival, Death, Tap |
| Mechanics | token, summon, banish, silence, Ward |
| Resources | draw, life-gain, life-loss, damage |
| Positioning | nearby, adjacent, front |

### Theme Detection

Decks are tagged with themes based on keyword combinations:

| Theme | Triggered By |
|-------|--------------|
| tokens | token + summon |
| sacrifice | Death + life-loss |
| control | silence + banish |
| aggro | damage + Arrival |
| ramp | draw + Genesis |

## Collection Filtering

### Filtering a Collection or Deck

```javascript
import { writeFilteredCollection } from './filter.js';
await writeFilteredCollection('necro-v1.json', 'necro-filtered');
```

### Finding Cards Not in a Deck

```javascript
import { excludeCommonItemsFromFiles } from './filter.js';
await excludeCommonItemsFromFiles(
  'collection-filtered.json',
  'deck-filtered.json',
  'remaining',
);
```

### Module API

```javascript
import { getFilteredCollection, excludeCommonItems } from './filter.js';

// Filter a raw collection/deck array
const filtered = getFilteredCollection(rawData);

// Find items in list1 not in list2
const unique = excludeCommonItems(list1, list2);
```

## Data Formats

### Collection Format (with pickles)

```json
{
  "card": { "id": "...", "name": "..." },
  "pickles": [{ "variantId": "...", "quantity": 2 }]
}
```

### Deck Format (direct quantity)

```json
{
  "quantity": 3,
  "card": { "id": "...", "name": "..." }
}
```

### Filtered Output

```json
{
  "card": { "id": "...", "name": "..." },
  "count": 3
}
```

## Project Structure

```
sorcery/
├── cli.js              # CLI entry point
├── filter.js           # Collection filtering (standalone + re-exports)
├── lib/
│   ├── deck-fetcher.js # curiosa.io API client
│   ├── deck-analyzer.js # Stats and synergy analysis
│   └── filter.js       # Core filtering functions
├── input/              # Source data files
└── output/             # Generated output files
```

## Troubleshooting

### TLS Certificate Errors

If you see `SELF_SIGNED_CERT_IN_CHAIN` errors (common with corporate proxies):

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node cli.js fetch-deck <url>
```

## License

MIT
