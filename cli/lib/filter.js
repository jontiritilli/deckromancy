import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.dirname(__dirname);
const INPUT_DIR = path.join(PROJECT_ROOT, 'input');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');

/**
 * Filters a collection/deck to items with quantity > 0
 * @param {Array} collection - Raw collection or deck data
 * @returns {Array} Filtered items with { card, count } structure
 */
export function getFilteredCollection(collection) {
  return collection
    .filter((item) => {
      // Handle collection format (with pickles array)
      if (item?.pickles?.length > 0) {
        return item.pickles.some((pickle) => pickle.quantity > 0);
      }
      // Handle deck format (with direct quantity)
      return (item.quantity ?? 0) > 0;
    })
    .map((item) => {
      // Destructure to exclude variants array (reduces output size)
      const { variants, ...card } = item.card;

      // Calculate count based on format
      let count = 0;
      if (item.pickles?.length > 0) {
        // Collection format: sum all pickle quantities
        count = item.pickles.reduce(
          (acc, pickle) => acc + (pickle.quantity ?? 0),
          0,
        );
      } else {
        // Deck format: use direct quantity
        count = item.quantity ?? 0;
      }

      return { card, count };
    });
}

/**
 * Excludes items from list1 that exist in list2 (by card ID)
 * @param {Array} list1 - Source list (must have item.card.id structure)
 * @param {Array} list2 - List of items to exclude
 * @returns {Array} Items from list1 not found in list2
 */
export function excludeCommonItems(list1, list2) {
  const list2CardIds = new Set(list2.map((item) => item.card.id));
  return list1.filter((item) => !list2CardIds.has(item.card.id));
}

/**
 * Ensures the output directory exists
 */
export async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Generates a timestamped filename
 */
export function getTimestampedPath(basename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return path.join(OUTPUT_DIR, `${basename}-${timestamp}.json`);
}

/**
 * Reads and filters a collection/deck file, writes to output directory
 */
export async function writeFilteredCollection(
  inputFilename,
  outputBasename = 'filtered',
) {
  const inputPath = path.join(INPUT_DIR, inputFilename);

  try {
    await ensureOutputDir();

    const raw = await fs.readFile(inputPath, 'utf8');
    const collection = JSON.parse(raw);
    const filtered = getFilteredCollection(collection);

    const outputPath = getTimestampedPath(outputBasename);
    await fs.writeFile(outputPath, JSON.stringify(filtered, null, 2));

    console.log(
      `Filtered ${inputFilename} → ${path.basename(outputPath)} (${
        filtered.length
      } items)`,
    );
    return { outputPath, count: filtered.length };
  } catch (err) {
    console.error(`Error processing ${inputFilename}:`, err.message);
    throw err;
  }
}

/**
 * Reads two files, excludes common items, writes result to output directory
 * Note: Input files should be pre-filtered (have item.card.id structure)
 * File paths are relative to project root (e.g., 'output/file.json')
 */
export async function excludeCommonItemsFromFiles(
  file1Path,
  file2Path,
  outputBasename = 'excluded',
) {
  try {
    await ensureOutputDir();

    const [raw1, raw2] = await Promise.all([
      fs.readFile(path.join(OUTPUT_DIR, file1Path), 'utf8'),
      fs.readFile(path.join(OUTPUT_DIR, file2Path), 'utf8'),
    ]);

    const list1 = JSON.parse(raw1);
    const list2 = JSON.parse(raw2);
    const excluded = excludeCommonItems(list1, list2);

    const outputPath = getTimestampedPath(outputBasename);
    await fs.writeFile(outputPath, JSON.stringify(excluded, null, 2));

    const removedCount = list1.length - excluded.length;
    console.log(
      `Excluded ${removedCount} common items → ${path.basename(outputPath)} (${
        excluded.length
      } remaining)`,
    );
    return { outputPath, count: excluded.length, removedCount };
  } catch (err) {
    console.error(`Error excluding items:`, err.message);
    throw err;
  }
}
