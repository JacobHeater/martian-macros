/**
 * The layout of a pack file. One place, read by the reader and written by
 * the writer (and the pipeline). Format 1 is the layout the Dart app wrote;
 * format 2 adds the micronutrient columns (MM-307); format 3 adds sugar
 * alcohols (MM-397); format 4 adds each food's group (MM-616); format 5 adds
 * each food's basis (per 100 g or per 100 mL) and lets a serving be a volume
 * in millilitres, a weight in grams, or both (MM-650). An older pack stays
 * readable, its foods without what it lacks: per 100 g, servings by weight.
 */
export const FoodPackFormat = {
  version: 5,

  /** The oldest format the reader still opens. */
  oldestReadable: 1,

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
  tier_reason TEXT NOT NULL,
  potassium_mg INTEGER,
  calcium_mg INTEGER,
  iron_mg INTEGER,
  magnesium_mg INTEGER,
  zinc_mg INTEGER,
  vitamin_a_ug INTEGER,
  vitamin_c_mg INTEGER,
  vitamin_d_ug INTEGER,
  vitamin_b12_ug INTEGER,
  folate_ug INTEGER,
  sugars_g INTEGER,
  saturated_fat_g INTEGER,
  cholesterol_mg INTEGER,
  sugar_alcohols INTEGER,
  food_group TEXT,
  basis TEXT NOT NULL DEFAULT 'g'
);
CREATE INDEX foods_by_group ON foods (food_group) WHERE food_group IS NOT NULL;
CREATE TABLE servings (
  food_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  grams INTEGER,
  milliliters INTEGER
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
