/**
 * The layout of a pack file. One place, read by the reader and written by
 * the writer (and the pipeline). It is the layout the Dart app wrote, so
 * packs built before the move stay readable.
 */
export const FoodPackFormat = {
  version: 1,

  /** Grams and kilocalories are stored times this, as integers. */
  nutrientScale: 100,

  /** Grams per millilitre are stored times this. */
  densityScale: 1000,

  schema: `
CREATE TABLE header (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;
CREATE TABLE foods (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  kcal INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  fiber INTEGER,
  sodium_mg INTEGER,
  alcohol INTEGER,
  preparation INTEGER NOT NULL,
  pair_id INTEGER,
  density INTEGER,
  source TEXT NOT NULL,
  source_id TEXT,
  tier INTEGER NOT NULL,
  tier_reason TEXT NOT NULL
);
CREATE TABLE servings (
  food_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  grams INTEGER NOT NULL
);
CREATE INDEX servings_by_food ON servings (food_id);
CREATE TABLE barcodes (
  gtin TEXT PRIMARY KEY,
  food_id INTEGER NOT NULL
) WITHOUT ROWID;
CREATE VIRTUAL TABLE foods_fts USING fts5(
  name, brand,
  content = 'foods', content_rowid = 'id',
  tokenize = 'unicode61 remove_diacritics 2',
  prefix = '2 3'
);
`,
} as const;
