// Re-export everything from lib/filter.js for backwards compatibility
export {
  getFilteredCollection,
  excludeCommonItems,
  ensureOutputDir,
  getTimestampedPath,
  writeFilteredCollection,
  excludeCommonItemsFromFiles,
} from './lib/filter.js';

// Import for main execution
import { writeFilteredCollection } from './lib/filter.js';

// Main execution
async function main() {
  // Process necro deck
  await writeFilteredCollection('necro-v0.json', 'necro-v0-filtered');

  // Example: Find cards in collection not in a deck
  // await excludeCommonItemsFromFiles(
  //   'collection-filtered-2025-01-03T12-00-00.json',
  //   'necro-v1-filtered-2025-01-03T12-00-00.json',
  //   'remaining',
  // );
}

main().catch(console.error);
