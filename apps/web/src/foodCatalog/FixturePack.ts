import { CatalogFood } from './CatalogFood';
import type { CatalogServing } from './CatalogServing';
import { FoodPackFormat } from './FoodPackFormat';
import type { FoodPackHeader } from './FoodPackHeader';
import type { PackEntry } from './PackEntry';
import type { PreparationState } from './PreparationState';

const packId = 'fixture';
const reason = 'Test data, not a nutrition source.';

/** The GTIN-14 for a 13-digit body, with its check digit appended. */
function gtin14(body13: string): string {
  let sum = 0;
  for (let i = 0; i < body13.length; i++) {
    const digit = body13.charCodeAt(i) - 0x30;
    const fromRight = body13.length - i;
    sum += digit * (fromRight % 2 === 1 ? 3 : 1);
  }
  return `${body13}${(10 - (sum % 10)) % 10}`;
}

interface Extras {
  fiber?: number;
  alcohol?: number;
  density?: number;
  brand?: string;
  preparation?: PreparationState;
  pair?: number;
  servings?: readonly CatalogServing[];
  barcodeBody?: string;
}

function entry(
  id: number,
  name: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  { fiber, alcohol, density, brand, preparation = 'unspecified', pair, servings = [], barcodeBody }: Extras = {},
): PackEntry {
  return {
    food: new CatalogFood({
      id,
      packId,
      name,
      brand,
      kcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      fiberG: fiber,
      alcoholG: alcohol,
      densityGPerMl: density,
      preparation,
      pairedFoodId: pair,
      source: 'fixture',
      sourceId: `fixture-${id}`,
      tier: brand === undefined ? 'reference' : 'label',
      tierReason: reason,
    }),
    servings,
    barcodes: barcodeBody === undefined ? [] : [gtin14(barcodeBody)],
  };
}

const header: FoodPackHeader = {
  packId,
  formatVersion: FoodPackFormat.version,
  builtOn: '2026-10-09',
  region: 'US',
  sources: ['Invented test data'],
  license: 'Test data: no license applies and it must not be published.',
  attribution: 'None: invented for tests.',
};

const entries: readonly PackEntry[] = [
  entry(1, 'Chicken breast, raw', 120, 22.5, 0, 2.6, { preparation: 'raw', pair: 2 }),
  entry(2, 'Chicken breast, cooked', 165, 31, 0, 3.6, {
    preparation: 'cooked',
    pair: 1,
    servings: [{ description: '1 breast', grams: 172 }],
  }),
  entry(3, 'White rice, raw', 365, 7, 80, 0.7, { preparation: 'raw', pair: 4 }),
  entry(4, 'White rice, cooked', 130, 2.7, 28, 0.3, {
    preparation: 'cooked',
    pair: 3,
    servings: [{ description: '1 cup', grams: 158 }],
  }),
  entry(5, 'Egg, whole', 143, 12.6, 0.7, 9.5, { servings: [{ description: '1 large egg', grams: 50 }] }),
  entry(6, 'Banana', 89, 1.1, 23, 0.3, { fiber: 2.6, servings: [{ description: '1 medium', grams: 118 }] }),
  entry(7, 'Apple', 52, 0.3, 14, 0.2, { fiber: 2.4, servings: [{ description: '1 medium', grams: 182 }] }),
  entry(8, 'Oats, dry', 389, 16.9, 66, 6.9, { fiber: 10.6, servings: [{ description: '1/2 cup', grams: 40 }] }),
  entry(9, 'Milk, whole', 61, 3.2, 4.8, 3.3, { density: 1.03, servings: [{ description: '1 cup', grams: 244 }] }),
  entry(10, 'Olive oil', 884, 0, 0, 100, { density: 0.91, servings: [{ description: '1 tbsp', grams: 13.5 }] }),
  entry(11, 'Almonds', 579, 21, 22, 50, { fiber: 12.5 }),
  entry(12, 'Broccoli, raw', 34, 2.8, 7, 0.4, { fiber: 2.6, preparation: 'raw' }),
  entry(13, 'Salmon, cooked', 206, 22, 0, 12, { preparation: 'cooked' }),
  entry(14, 'Bread, white', 265, 9, 49, 3.2, { fiber: 2.7 }),
  entry(15, 'Greek yogurt, plain nonfat', 59, 10.2, 3.6, 0.4),
  entry(16, 'Lentils, cooked', 116, 9, 20, 0.4, { fiber: 7.9, preparation: 'cooked' }),
  entry(17, 'Sweet potato, baked', 90, 2, 21, 0.2, { fiber: 3.3, preparation: 'cooked' }),
  entry(18, 'Peanut butter', 588, 25, 20, 50, { fiber: 6 }),
  entry(19, 'Cheddar cheese', 403, 25, 1.3, 33),
  entry(20, 'Ground beef, lean, cooked', 250, 26, 0, 15, { preparation: 'cooked' }),
  entry(21, 'Black beans, cooked', 132, 8.9, 24, 0.5, { fiber: 8.7, preparation: 'cooked' }),
  entry(22, 'Orange juice', 45, 0.7, 10.4, 0.2, { density: 1.04 }),
  entry(23, 'Red wine', 85, 0.1, 2.6, 0, { alcohol: 10.6, density: 0.99 }),
  entry(24, 'Protein bar, chocolate', 380, 33, 35, 12, {
    brand: 'Test Brand',
    preparation: 'packaged',
    barcodeBody: '0000100000011',
    servings: [{ description: '1 bar', grams: 60 }],
  }),
  entry(25, 'Cola', 42, 0, 10.6, 0, {
    brand: 'Test Brand',
    density: 1.04,
    preparation: 'packaged',
    barcodeBody: '0000100000028',
  }),
  entry(26, 'Corn flakes cereal', 375, 8, 80, 2.5, {
    brand: 'Test Brand',
    preparation: 'packaged',
    barcodeBody: '0000100000035',
  }),
  entry(27, 'Pasta, dry', 371, 13, 75, 1.5, { preparation: 'raw', pair: 28 }),
  entry(28, 'Pasta, cooked', 158, 5.8, 31, 0.9, { preparation: 'cooked', pair: 27 }),
  entry(29, 'Avocado', 160, 2, 8.5, 14.7, { fiber: 6.7 }),
  entry(30, 'Tofu, firm', 144, 17, 3, 9),
];

/**
 * A small invented pack for tests and for building screens before the real
 * pack exists (MM-55). **The values are rounded, from general knowledge, and
 * are not a nutrition source**: nothing here may be shown to a user as a
 * food's real nutrition.
 */
export const FixturePack = { packId, header, entries, gtin14 } as const;
