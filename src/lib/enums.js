export const CardType = {
  Minion: 'Minion',
  Magic: 'Magic',
  Site: 'Site',
  Aura: 'Aura',
  Artifact: 'Artifact',
  Unknown: 'Unknown',
};

export const Rarity = {
  Ordinary: 'Ordinary',
  Exceptional: 'Exceptional',
  Elite: 'Elite',
  Unique: 'Unique',
};

export const RARITY_ORDER = [Rarity.Ordinary, Rarity.Exceptional, Rarity.Elite, Rarity.Unique];

export const Element = {
  Fire: 'fire',
  Water: 'water',
  Earth: 'earth',
  Air: 'air',
  None: 'none',
};

export const ELEMENT_LABELS = {
  [Element.Fire]: 'Fire',
  [Element.Water]: 'Water',
  [Element.Earth]: 'Earth',
  [Element.Air]: 'Air',
  [Element.None]: 'None',
};
