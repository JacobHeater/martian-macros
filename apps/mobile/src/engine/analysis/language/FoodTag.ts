const values = [
  // How it was made.
  'fried',
  'breaded',
  'sauced',
  'creamy',
  'cheesy',
  'grilled',
  'steamed',
  'baked',
  'roasted',
  'raw',
  // What kind of food it is.
  'processedMeat',
  'fattyMeat',
  'leanProtein',
  'seafood',
  'egg',
  'dairy',
  'legume',
  'nut',
  'vegetable',
  'fruit',
  'salad',
  'soup',
  'refinedGrain',
  'wholeGrain',
  'pastry',
  'dessert',
  'candy',
  'snackFood',
  'sugaryDrink',
  'dietDrink',
  'alcohol',
  'spread',
  // Where it came from.
  'fastFood',
  'buffet',
  'restaurant',
] as const;

/**
 * What the coach knows about a food from its name (MM-617): how it was made
 * and what kind of food it is. Nutrients say the rest. Found by
 * `foodTagsOf`, a deterministic tagger over a reviewed lexicon.
 */
export type FoodTag = (typeof values)[number];

export const FoodTag = { values } as const;
