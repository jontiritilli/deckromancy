/**
 * Analyzes deck data and extracts statistics and synergies
 */

const KEYWORD_PATTERNS = {
  // Triggers
  Genesis: /\bGenesis\b/i,
  Arrival: /\bArrival\b/i,
  Death: /\bDeath\b/i,
  Tap: /\bTap\b/i,

  // Mechanics
  token: /\btoken\b/i,
  summon: /\bsummon\b/i,
  banish: /\bbanish\b/i,
  silence: /\bsilence\b/i,
  Ward: /\bWard\b/i,

  // Resources
  draw: /\bdraw\b/i,
  'life-gain': /\bgain.*life\b/i,
  'life-loss': /\blose.*life|lost life\b/i,
  damage: /\bdamage\b/i,

  // Positioning
  nearby: /\bnearby\b/i,
  adjacent: /\badjacent\b/i,
  front: /\bfront\b/i,
};

// Theme detection based on keyword combinations
const THEME_RULES = {
  tokens: ['token', 'summon'],
  sacrifice: ['Death', 'life-loss'],
  control: ['silence', 'banish'],
  aggro: ['damage', 'Arrival'],
  ramp: ['draw', 'Genesis'],
};

/**
 * Extract keywords from a card's rules text
 * @param {string} rulesText - The card's rules text
 * @returns {string[]} Array of matched keywords
 */
export function extractKeywords(rulesText) {
  if (!rulesText) return [];

  const keywords = [];
  for (const [keyword, pattern] of Object.entries(KEYWORD_PATTERNS)) {
    if (pattern.test(rulesText)) {
      keywords.push(keyword);
    }
  }
  return keywords;
}

/**
 * Compute deck statistics from card list
 * @param {Array} cards - Array of deck cards with card data and quantity
 * @returns {Object} Statistics object
 */
export function computeStats(cards) {
  const manaCurve = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, '7+': 0 };
  const elementBreakdown = { fire: 0, water: 0, earth: 0, air: 0, none: 0 };
  const maxThresholds = { fire: 0, water: 0, earth: 0, air: 0 };
  const typeBreakdown = {};
  const rarityBreakdown = {};
  const siteElementBreakdown = { fire: 0, water: 0, earth: 0, air: 0, none: 0 };
  const typeElementBreakdown = {
    Minion: { fire: 0, water: 0, earth: 0, air: 0, none: 0 },
    Magic: { fire: 0, water: 0, earth: 0, air: 0, none: 0 },
    Site: { fire: 0, water: 0, earth: 0, air: 0, none: 0 },
    Aura: { fire: 0, water: 0, earth: 0, air: 0, none: 0 },
  };

  let totalCards = 0;
  let totalCost = 0;
  let cardsWithCost = 0;

  for (const item of cards) {
    const card = item.card;
    const qty = item.quantity;
    totalCards += qty;

    // Mana curve (Sites have null cost)
    const cost = card.cost;
    if (cost !== null && cost !== undefined) {
      const bucket = cost >= 7 ? '7+' : cost;
      manaCurve[bucket] = (manaCurve[bucket] || 0) + qty;
      totalCost += cost * qty;
      cardsWithCost += qty;
    }

    // Element breakdown
    const elements = card.elements || [];
    if (elements.length === 0) {
      elementBreakdown.none += qty;
    } else {
      for (const el of elements) {
        const elName = el.id?.toLowerCase() || el.name?.toLowerCase();
        if (elName && Object.prototype.hasOwnProperty.call(elementBreakdown, elName)) {
          elementBreakdown[elName] += qty;
        }
      }
    }

    // Max thresholds
    if (card.fireThreshold > maxThresholds.fire) {
      maxThresholds.fire = card.fireThreshold;
    }
    if (card.waterThreshold > maxThresholds.water) {
      maxThresholds.water = card.waterThreshold;
    }
    if (card.earthThreshold > maxThresholds.earth) {
      maxThresholds.earth = card.earthThreshold;
    }
    if (card.airThreshold > maxThresholds.air) {
      maxThresholds.air = card.airThreshold;
    }

    // Type breakdown
    const type = card.type || 'Unknown';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + qty;

    // Site element breakdown
    if (type === 'Site') {
      if (elements.length === 0) {
        siteElementBreakdown.none += qty;
      } else {
        for (const el of elements) {
          const elName = el.id?.toLowerCase() || el.name?.toLowerCase();
          if (elName && Object.prototype.hasOwnProperty.call(siteElementBreakdown, elName)) {
            siteElementBreakdown[elName] += qty;
          }
        }
      }
    }

    // Type-element breakdown
    if (typeElementBreakdown[type]) {
      if (elements.length === 0) {
        typeElementBreakdown[type].none += qty;
      } else {
        for (const el of elements) {
          const elName = el.id?.toLowerCase() || el.name?.toLowerCase();
          if (elName && Object.prototype.hasOwnProperty.call(typeElementBreakdown[type], elName)) {
            typeElementBreakdown[type][elName] += qty;
          }
        }
      }
    }

    // Rarity breakdown
    const rarity = card.rarity || 'Unknown';
    rarityBreakdown[rarity] = (rarityBreakdown[rarity] || 0) + qty;
  }

  const avgCost = cardsWithCost > 0 ? +(totalCost / cardsWithCost).toFixed(2) : 0;

  return {
    totalCards,
    avgCost,
    manaCurve,
    elementBreakdown,
    maxThresholds,
    typeBreakdown,
    rarityBreakdown,
    siteElementBreakdown,
    typeElementBreakdown,
  };
}

/**
 * Aggregate synergies across all cards in the deck
 * @param {Array} cards - Array of deck cards with card data
 * @returns {Object} Synergies object with keywords and themes
 */
export function aggregateSynergies(cards) {
  const keywordCounts = {};

  for (const item of cards) {
    const card = item.card;
    const qty = item.quantity;
    const keywords = extractKeywords(card.rulesText);

    for (const kw of keywords) {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + qty;
    }
  }

  // Detect themes based on keyword presence
  const themes = [];
  for (const [theme, requiredKeywords] of Object.entries(THEME_RULES)) {
    const hasTheme = requiredKeywords.some((kw) => keywordCounts[kw] > 0);
    if (hasTheme) {
      themes.push(theme);
    }
  }

  return {
    keywords: keywordCounts,
    themes,
  };
}

/**
 * Transform a deck card item into the output format
 * @param {Object} item - Raw deck item from API
 * @returns {Object} Formatted card object
 */
export function formatCard(item) {
  const card = item.card;
  const keywords = extractKeywords(card.rulesText);

  // Get image URL from first variant if available
  const imageUrl = card.variants?.[0]?.src ?? null;

  return {
    name: card.name,
    type: card.type,
    cost: card.cost,
    attack: card.attack,
    defense: card.defense,
    elements: (card.elements || []).map((e) => e.name),
    rarity: card.rarity,
    rulesText: card.rulesText,
    quantity: item.quantity,
    keywords,
    imageUrl,
    fireThreshold: card.fireThreshold || 0,
    waterThreshold: card.waterThreshold || 0,
    earthThreshold: card.earthThreshold || 0,
    airThreshold: card.airThreshold || 0,
  };
}

/**
 * Format avatar data for display
 * @param {Object} avatar - Raw avatar card data
 * @returns {Object|null} Formatted avatar object
 */
export function formatAvatar(avatar) {
  if (!avatar) return null;

  const imageUrl = avatar.variants?.[0]?.src ?? null;

  return {
    name: avatar.name,
    rulesText: avatar.rulesText,
    life: avatar.life,
    attack: avatar.attack,
    defense: avatar.defense,
    imageUrl,
  };
}

/**
 * Compute stats from already-formatted cards (as returned by formatCard).
 * Elements are capitalized names ('Fire', 'Water') — lowercased for stat keys.
 * @param {Array} cards - Array of formatted card objects
 * @returns {Object} Statistics object (same shape as computeStats)
 */
export function computeStatsFromFormattedCards(cards) {
  const manaCurve = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, '7+': 0 };
  const elementBreakdown = { fire: 0, water: 0, earth: 0, air: 0, none: 0 };
  const maxThresholds = { fire: 0, water: 0, earth: 0, air: 0 };
  const typeBreakdown = {};
  const rarityBreakdown = {};
  const siteElementBreakdown = { fire: 0, water: 0, earth: 0, air: 0, none: 0 };
  const typeElementBreakdown = {
    Minion: { fire: 0, water: 0, earth: 0, air: 0, none: 0 },
    Magic: { fire: 0, water: 0, earth: 0, air: 0, none: 0 },
    Site: { fire: 0, water: 0, earth: 0, air: 0, none: 0 },
    Aura: { fire: 0, water: 0, earth: 0, air: 0, none: 0 },
  };

  let totalCards = 0;
  let totalCost = 0;
  let cardsWithCost = 0;

  for (const card of cards) {
    const qty = card.quantity;
    totalCards += qty;

    const cost = card.cost;
    if (cost !== null && cost !== undefined) {
      const bucket = cost >= 7 ? '7+' : cost;
      manaCurve[bucket] = (manaCurve[bucket] || 0) + qty;
      totalCost += cost * qty;
      cardsWithCost += qty;
    }

    const elements = card.elements || [];
    if (elements.length === 0) {
      elementBreakdown.none += qty;
    } else {
      for (const el of elements) {
        const elKey = el.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(elementBreakdown, elKey)) {
          elementBreakdown[elKey] += qty;
        }
      }
    }

    if ((card.fireThreshold || 0) > maxThresholds.fire) maxThresholds.fire = card.fireThreshold;
    if ((card.waterThreshold || 0) > maxThresholds.water) maxThresholds.water = card.waterThreshold;
    if ((card.earthThreshold || 0) > maxThresholds.earth) maxThresholds.earth = card.earthThreshold;
    if ((card.airThreshold || 0) > maxThresholds.air) maxThresholds.air = card.airThreshold;

    const type = card.type || 'Unknown';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + qty;

    if (type === 'Site') {
      if (elements.length === 0) {
        siteElementBreakdown.none += qty;
      } else {
        for (const el of elements) {
          const elKey = el.toLowerCase();
          if (Object.prototype.hasOwnProperty.call(siteElementBreakdown, elKey)) {
            siteElementBreakdown[elKey] += qty;
          }
        }
      }
    }

    if (typeElementBreakdown[type]) {
      if (elements.length === 0) {
        typeElementBreakdown[type].none += qty;
      } else {
        for (const el of elements) {
          const elKey = el.toLowerCase();
          if (Object.prototype.hasOwnProperty.call(typeElementBreakdown[type], elKey)) {
            typeElementBreakdown[type][elKey] += qty;
          }
        }
      }
    }

    const rarity = card.rarity || 'Unknown';
    rarityBreakdown[rarity] = (rarityBreakdown[rarity] || 0) + qty;
  }

  const avgCost = cardsWithCost > 0 ? +(totalCost / cardsWithCost).toFixed(2) : 0;

  return {
    totalCards,
    avgCost,
    manaCurve,
    elementBreakdown,
    maxThresholds,
    typeBreakdown,
    rarityBreakdown,
    siteElementBreakdown,
    typeElementBreakdown,
  };
}

/**
 * Main entry point - analyze a complete deck
 * @param {Array} decklist - Raw decklist from API
 * @param {Object} avatar - Avatar card data
 * @param {Array} sideboard - Raw sideboard from API
 * @param {Array} maybeboard - Raw maybeboard from API
 * @param {string} deckId - The deck ID
 * @param {string} sourceUrl - Original URL
 * @param {string|null} deckName - User-given deck name
 * @returns {Object} Complete analyzed deck output
 */
export function analyzeDeck(decklist, avatar, sideboard, maybeboard, deckId, sourceUrl, deckName) {
  const stats = computeStats(decklist);
  const synergies = aggregateSynergies(decklist);
  const cards = decklist.map(formatCard);

  return {
    deckId,
    deckName: deckName || null,
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    avatar: formatAvatar(avatar),
    stats,
    synergies,
    cards,
    sideboard: sideboard.map(formatCard),
    maybeboard: maybeboard.map(formatCard),
  };
}
