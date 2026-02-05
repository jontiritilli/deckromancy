#!/usr/bin/env node

import { fetchDeckById, extractDeckId } from './lib/deck-fetcher.js';
import { analyzeDeck } from './lib/deck-analyzer.js';

const COMMANDS = {
  'fetch-deck': {
    description: 'Fetch and analyze a deck from curiosa.io',
    usage: 'fetch-deck <deck-url>',
    handler: handleFetchDeck,
  },
};

function printUsage() {
  console.error('Usage: node cli.js <command> [arguments]\n');
  console.error('Commands:');
  for (const [name, cmd] of Object.entries(COMMANDS)) {
    console.error(`  ${cmd.usage.padEnd(30)} ${cmd.description}`);
  }
}

async function handleFetchDeck(args) {
  const url = args[0];

  if (!url) {
    console.error('Error: Missing deck URL');
    console.error('Usage: node cli.js fetch-deck <deck-url>');
    console.error('Example: node cli.js fetch-deck https://curiosa.io/decks/cmjno8n062dht6bfopd0kegs0');
    process.exit(1);
  }

  const deckId = extractDeckId(url);
  if (!deckId) {
    console.error(`Error: Could not extract deck ID from URL: ${url}`);
    console.error('Expected format: https://curiosa.io/decks/<deck-id>');
    process.exit(1);
  }

  try {
    const { decklist, avatar, sideboard, maybeboard } = await fetchDeckById(deckId);
    const result = analyzeDeck(decklist, avatar, sideboard, maybeboard, deckId, url);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error fetching deck: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !COMMANDS[command]) {
    printUsage();
    process.exit(command ? 1 : 0);
  }

  await COMMANDS[command].handler(args.slice(1));
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
