# Sorcery Collection Manager — Product Specification

## 1. Overview

**Sorcery Collection Manager** is a dual-interface application for managing **Sorcery TCG** (Trading Card Game) card collections and decks. It fetches deck data from the [curiosa.io](https://curiosa.io) platform, performs statistical analysis, detects synergies and themes, and provides interactive visualization.

The application ships as two interfaces:

| Interface | Purpose | Runtime |
|-----------|---------|---------|
| **Node.js CLI** | Fetch decks, analyze stats, filter collections, pipe JSON output | Node.js 18+ |
| **React Web App** | Interactive deck visualization with charts, filters, and card browsing | Browser (Vite + Vercel) |

---

## 2. Architecture

### 2.1 System Diagram

```
┌──────────────┐     tRPC batch     ┌──────────────────┐
│  curiosa.io  │◄────────────────── │  API Proxy Layer  │
│  (upstream)  │────────────────────│  (Vite dev / Vercel) │
└──────────────┘                    └────────┬─────────┘
                                             │
                        ┌────────────────────┴────────────────────┐
                        │                                         │
                ┌───────▼───────┐                        ┌────────▼───────┐
                │   React App   │                        │    Node CLI    │
                │  (Browser)    │                        │  (Terminal)    │
                └───────────────┘                        └────────────────┘
```

### 2.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS 3.4, Chart.js 4.4 (via react-chartjs-2) |
| Build | Vite 5 |
| API Proxy | Vite custom middleware (dev), Vercel serverless function (prod) |
| CLI | Node.js 18+ (ES modules) |
| Data Source | curiosa.io tRPC API (batch endpoint) |
| Deployment | Vercel |

### 2.3 Project Structure

```
sorcery/
├── api/
│   └── deck.js                  # Vercel serverless proxy
├── cli/
│   ├── cli.js                   # CLI entry point (fetch-deck command)
│   ├── filter.js                # Collection filtering entry point
│   └── lib/
│       ├── deck-fetcher.js      # curiosa.io tRPC client (Node)
│       ├── deck-analyzer.js     # Stats & synergy engine (Node)
│       └── filter.js            # Collection filter/diff utilities
├── src/
│   ├── main.jsx                 # React mount
│   ├── App.jsx                  # Root layout component
│   ├── index.css                # Tailwind imports + base styles
│   ├── components/
│   │   ├── DeckInput.jsx        # URL input form
│   │   ├── DeckHeader.jsx       # Avatar display + deck summary
│   │   ├── StatsOverview.jsx    # Type counts + threshold badges
│   │   ├── ManaCurveChart.jsx   # Bar chart — cost distribution
│   │   ├── ElementChart.jsx     # Doughnut chart — element breakdown
│   │   ├── TypeChart.jsx        # Pie chart — card type breakdown
│   │   ├── RarityChart.jsx      # Horizontal bar — rarity distribution
│   │   ├── SynergyTags.jsx      # Keyword + theme badge display
│   │   └── CardList.jsx         # Searchable, filterable card table
│   ├── hooks/
│   │   └── useDeck.js           # Deck state management hook
│   └── lib/
│       ├── deck-fetcher.js      # curiosa.io client (browser)
│       └── deck-analyzer.js     # Stats & synergy engine (browser)
├── index.html                   # HTML shell
├── vite.config.js               # Vite + dev proxy config
├── tailwind.config.js           # Tailwind config
├── postcss.config.js            # PostCSS config
├── vercel.json                  # Vercel deployment config
└── package.json                 # Dependencies & scripts
```

---

## 3. Data Source & API Integration

### 3.1 Upstream API

The application consumes the **curiosa.io tRPC batch endpoint**:

```
GET https://curiosa.io/api/trpc/decklist.getDecklistById,decklist.getAvatarById,decklist.getSideboardById,decklist.getMaybeboardById
```

Each request fetches four procedures in a single batch call:

| Procedure | Purpose |
|-----------|---------|
| `decklist.getDecklistById` | Main deck card list with quantities |
| `decklist.getAvatarById` | Avatar (commander) card |
| `decklist.getSideboardById` | Sideboard cards |
| `decklist.getMaybeboardById` | Maybeboard cards |

**Required headers** (for CORS compliance):
- `Content-Type: application/json`
- `x-trpc-source: nextjs-react`
- `Origin: https://curiosa.io`
- `Referer: https://curiosa.io/`

### 3.2 Proxy Layer

Direct browser requests to curiosa.io are blocked by CORS. The app uses a proxy:

- **Development**: Vite custom middleware plugin intercepts `/api/deck?id=<deckId>` and forwards to curiosa.io with correct headers.
- **Production**: Vercel serverless function at `api/deck.js` performs the same proxy.

### 3.3 Deck ID Extraction

Deck IDs are extracted from curiosa.io URLs via regex:

```
Pattern: /curiosa\.io\/decks\/([a-zA-Z0-9]+)/
Example: https://curiosa.io/decks/cmjno8n062dht6bfopd0kegs0
Result:  cmjno8n062dht6bfopd0kegs0
```

Raw deck IDs (without URL) are also accepted.

---

## 4. Data Models

### 4.1 Upstream Card Schema (from curiosa.io)

```
Card {
  id:              string
  name:            string
  type:            "Minion" | "Magic" | "Site" | "Aura"
  cost:            number | null
  attack:          number
  defense:         number
  rarity:          "Ordinary" | "Exceptional" | "Elite" | "Unique"
  rulesText:       string
  elements:        Element[]
  fireThreshold:   number
  waterThreshold:  number
  earthThreshold:  number
  airThreshold:    number
  variants:        Variant[]
}

Element {
  id:   string
  name: "Fire" | "Water" | "Earth" | "Air"
}

Variant {
  src: string   // image URL
}
```

### 4.2 Analyzed Deck Output

The `analyzeDeck()` function produces the following structure:

```
AnalyzedDeck {
  deckId:     string
  sourceUrl:  string
  fetchedAt:  ISO 8601 timestamp
  avatar:     FormattedAvatar
  stats:      DeckStats
  synergies:  Synergies
  cards:      FormattedCard[]
  sideboard:  FormattedCard[]
  maybeboard: FormattedCard[]
}

FormattedAvatar {
  name:      string
  rulesText: string
  life:      number
  attack:    number
  defense:   number
  imageUrl:  string | null
}

FormattedCard {
  name:      string
  type:      string
  cost:      number | null
  attack:    number
  defense:   number
  elements:  string[]
  rarity:    string
  rulesText: string
  quantity:  number
  keywords:  string[]
  imageUrl:  string | null
}

DeckStats {
  totalCards:        number
  avgCost:           number (2 decimal places)
  manaCurve:         { "0": n, "1": n, ..., "7+": n }
  elementBreakdown:  { fire: n, water: n, earth: n, air: n, none: n }
  maxThresholds:     { fire: n, water: n, earth: n, air: n }
  typeBreakdown:     { Minion: n, Magic: n, Site: n, Aura: n }
  rarityBreakdown:   { Ordinary: n, Exceptional: n, Elite: n, Unique: n }
}

Synergies {
  keywords: { [keyword: string]: count }
  themes:   string[]
}
```

### 4.3 Collection Format (Filter Input)

```
CollectionItem {
  card: {
    id:   string
    name: string
  }
  pickles: Pickle[]   // collection format
  quantity: number     // deck format
}

Pickle {
  variantId: string
  quantity:  number
}
```

### 4.4 Filtered Output

```
FilteredItem {
  card:  Card
  count: number
}
```

---

## 5. Features

### 5.1 Deck Fetching

**CLI**: `node cli.js fetch-deck <url-or-id>`

- Accepts a full curiosa.io URL or a bare deck ID
- Fetches all four deck components (main, avatar, sideboard, maybeboard)
- Runs analysis pipeline
- Outputs analyzed JSON to stdout (pipeable to `jq`, files, etc.)

**Web App**: User enters a curiosa.io deck URL in the input form. The app fetches via the proxy endpoint and displays results.

### 5.2 Deck Analysis Engine

The analysis engine (`deck-analyzer.js`) computes:

#### 5.2.1 Statistical Breakdowns

| Metric | Description |
|--------|-------------|
| **Total Cards** | Sum of all card quantities in the deck |
| **Average Cost** | Mean mana cost across all cards (weighted by quantity) |
| **Mana Curve** | Distribution of cards by cost: buckets 0 through 6, plus 7+ |
| **Element Breakdown** | Count of cards per element (fire, water, earth, air, none) |
| **Max Thresholds** | Highest threshold value in deck for each element |
| **Type Breakdown** | Count of cards per type (Minion, Magic, Site, Aura) |
| **Rarity Breakdown** | Count of cards per rarity (Ordinary, Exceptional, Elite, Unique) |

#### 5.2.2 Keyword Extraction

Keywords are extracted from card `rulesText` via regex pattern matching. The system tracks **18 keywords** across 4 categories:

| Category | Keywords |
|----------|----------|
| Triggers | Genesis, Arrival, Death, Tap |
| Mechanics | token, summon, banish, silence, Ward |
| Resources | draw, life-gain, life-loss, damage |
| Positioning | nearby, adjacent, front |

Keywords are counted by occurrence across all cards (weighted by quantity).

#### 5.2.3 Theme Detection

Themes are inferred from keyword combinations:

| Theme | Required Keywords |
|-------|------------------|
| Tokens | `token` + `summon` |
| Sacrifice | `Death` + `life-loss` |
| Control | `silence` + `banish` |
| Aggro | `damage` + `Arrival` |
| Ramp | `draw` + `Genesis` |

A theme is detected when **both** required keywords appear in the deck's keyword set.

### 5.3 Collection Filtering

The CLI provides utilities for filtering and comparing card collections:

- **`getFilteredCollection(data)`**: Filters items to only those with quantity > 0. Handles both collection format (`pickles[].quantity`) and deck format (`item.quantity`).
- **`excludeCommonItems(list1, list2)`**: Returns items in list1 that do not appear in list2 (by card ID). Useful for finding cards you own but aren't in a particular deck.
- **`writeFilteredCollection(inputFile, outputName)`**: Reads a JSON file, filters it, and writes the result to a timestamped output file.
- **`excludeCommonItemsFromFiles(file1, file2, outputName)`**: Reads two JSON files, computes their difference, and writes the result.

Output files are written to `cli/output/` with timestamps in the filename.

### 5.4 Web Visualization

The React app provides an interactive dashboard with the following components:

#### 5.4.1 Deck Input (`DeckInput`)
- Text input accepting curiosa.io URLs or deck IDs
- Submit button with loading spinner during fetch
- Clear button to reset the view

#### 5.4.2 Deck Header (`DeckHeader`)
- Avatar card image (or placeholder)
- Avatar stats: life, attack, defense
- Deck summary: total cards, average cost
- Element summary with color-coded badges

#### 5.4.3 Stats Overview (`StatsOverview`)
- 4-column grid showing type counts (Minions, Magics, Sites, Auras)
- Max threshold badges for each element with color coding

#### 5.4.4 Charts
- **Mana Curve** (bar chart): Card count by cost bucket (0–7+), purple gradient bars
- **Element Distribution** (doughnut chart): Proportional element breakdown, color-coded
- **Type Distribution** (pie chart): Card type proportions
- **Rarity Distribution** (horizontal bar chart): Ordered Ordinary → Exceptional → Elite → Unique

All charts use Chart.js with dark-theme styling.

#### 5.4.5 Synergy Tags (`SynergyTags`)
- Keyword badges sorted by frequency (descending)
- Theme badges in a separate section
- Purple/gray badge styling

#### 5.4.6 Card List (`CardList`)
- Full card table with columns: image, name, type, element, cost, rarity, quantity
- **Search**: Text filter across card names
- **Type filter**: Dropdown to filter by card type
- **Element filter**: Dropdown to filter by element
- **Sorting**: Clickable column headers (name, type, cost, quantity) with ascending/descending toggle
- Lazy-loaded card images with placeholder fallback

### 5.5 UI/UX

- **Dark theme**: gray-900 background, gray-100 text throughout
- **Responsive layout**: Single column on mobile, 2-column grid for charts on desktop
- **Loading states**: Spinner animation on fetch button, disabled inputs during load
- **Error handling**: Error messages displayed in red below the input form

---

## 6. CLI Reference

### 6.1 fetch-deck

```bash
node cli/cli.js fetch-deck <deck-url>
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `<deck-url>` | Yes | curiosa.io deck URL or bare deck ID |

**Output**: Analyzed deck JSON to stdout.

**Examples**:
```bash
# Fetch and display full analysis
node cli/cli.js fetch-deck https://curiosa.io/decks/cmjno8n062dht6bfopd0kegs0

# Extract just stats
node cli/cli.js fetch-deck <url> | jq '.stats'

# Filter cards by keyword
node cli/cli.js fetch-deck <url> | jq '.cards[] | select(.keywords | index("Genesis"))'

# Save to file
node cli/cli.js fetch-deck <url> > output/my-deck.json
```

### 6.2 filter

```bash
node cli/filter.js
```

Runs the hardcoded `main()` function which reads from `cli/input/`, filters, and writes to `cli/output/`. Edit `main()` to specify input files and operations.

---

## 7. Deployment

### 7.1 Development

```bash
npm install
npm run dev          # Starts Vite dev server with API proxy
```

The Vite dev server includes a custom plugin that proxies `/api/deck?id=<deckId>` requests to curiosa.io with the required CORS headers.

### 7.2 Production Build

```bash
npm run build        # Outputs to dist/
npm run preview      # Preview production build locally
```

### 7.3 Vercel Deployment

Configured via `vercel.json`:
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Framework preset**: Vite
- **Serverless function**: `api/deck.js` handles proxy requests

---

## 8. Known Limitations & Technical Debt

| Item | Description |
|------|-------------|
| **Duplicated analysis code** | `deck-analyzer.js` exists in both `cli/lib/` and `src/lib/` with near-identical logic. Could be consolidated into a shared package. |
| **Duplicated fetcher code** | `deck-fetcher.js` exists in both `cli/lib/` (Node fetch) and `src/lib/` (browser fetch via proxy). The proxy abstraction differs but the parsing logic is shared. |
| **No test suite** | No unit tests, integration tests, or E2E tests exist. |
| **Hardcoded keyword/theme lists** | Keywords and theme rules are hardcoded in the analyzer. Adding new keywords requires code changes. |
| **No authentication** | No user accounts or saved state. All operations are stateless. |
| **No caching** | Each deck fetch hits the upstream API. No client-side or server-side caching. |
| **Collection filter is manual** | The `filter.js` CLI requires editing source code to specify input files. No CLI arguments. |
| **TLS workaround** | Some environments require `NODE_TLS_REJECT_UNAUTHORIZED=0` for the CLI to connect to curiosa.io. |

---

## 9. Future Considerations

These are areas identified from the current codebase that could be expanded. They are not commitments or planned features.

- **Shared library**: Extract `deck-analyzer.js` and common types into a shared package used by both CLI and web app.
- **Deck comparison**: Side-by-side comparison of two decks (stats, cards, synergies).
- **Collection integration**: Import/manage full card collections in the web UI, not just the CLI.
- **Persistent storage**: Save analyzed decks locally or in a database for history and comparison.
- **Testing**: Unit tests for the analysis engine, integration tests for the API proxy, E2E tests for the web app.
- **Configurable analysis**: Allow users to define custom keywords and theme rules.
