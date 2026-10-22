import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { FoodPackFormat } from '../../src/foodCatalog/FoodPackFormat';

/**
 * MM-51 question 7: `tool/spikes/food_sources/pantry_coverage.py` looks barcodes up in a pack by
 * `barcodes.gtin`. It is Python and is not run here, so this reads it: if the pack's barcode table
 * or column is renamed, the owner's pantry test would fail on the day it is run, not here.
 */
const script = readFileSync(new URL('../../../../tool/spikes/food_sources/pantry_coverage.py', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../../../../tool/spikes/food_sources/README.md', import.meta.url), 'utf8');

it("the pack's schema still has the barcodes table the pantry script reads", () => {
  expect(FoodPackFormat.schema).toMatch(/CREATE TABLE barcodes \(\s*gtin TEXT\b/);
});

it('the pantry script queries barcodes by gtin, and its docs and the README say so', () => {
  expect(script).toMatch(/from barcodes where gtin = \?/);
  expect(script).toContain('barcodes(gtin, food_id)');
  expect(readme).toContain('pantry_coverage.py');
  expect(readme).toContain('barcodes(gtin, food_id)');
});
