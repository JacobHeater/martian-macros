import { expect, it } from 'vitest';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { FoodPack } from '../../src/foodCatalog/FoodPack';
import type { SearchHit } from '../../src/foodCatalog/SearchHit';
import { searchOrder } from '../../src/foodCatalog/searchOrder';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { searchResultAmount } from '../../src/format/searchResultAmount';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/**
 * MM-627 (the owner, 2026-10-26, D-3): food search lists the closest name
 * first, and the source's reliability decides only among names as close.
 */
const hit = (id: number, name: string, source: string, score = -1): SearchHit => ({
  food: new CatalogFood({ id, packId: 'p', name, kcal: 100, proteinG: 5, carbsG: 15, fatG: 2, source, tier: 'reference', tierReason: 'test' }),
  score,
});

const ordered = (query: string, hits: SearchHit[]) => [...hits].sort(searchOrder(query)).map((h) => h.food.name);

it('MM-627: the closest name lists first, whatever its source', () => {
  expect(ordered('oats', [hit(1, 'Oats, rolled, dry', 'usda_sr_legacy'), hit(2, 'Oats', 'off')])).toEqual(['Oats', 'Oats, rolled, dry']);
});

it('MM-627: near-identical names list by the reliability of their source', () => {
  expect(ordered('banana', [hit(1, 'Banana', 'off'), hit(2, 'Banana, raw', 'usda_foundation')])).toEqual(['Banana, raw', 'Banana']);
});

it('MM-627: a name that begins as typed lists above one that only holds the words', () => {
  expect(
    ordered('chick bre', [
      hit(1, 'Sandwich, chicken breast', 'usda_fndds'),
      hit(2, 'Chicken breast, roasted', 'usda_fndds'),
    ]),
  ).toEqual(['Chicken breast, roasted', 'Sandwich, chicken breast']);
});

it('MM-627: more of the words typed matched lists first', () => {
  expect(
    ordered('chicken breast skinless', [hit(1, 'Chicken thigh', 'usda_foundation'), hit(2, 'Chicken breast, roasted', 'usda_fndds')]),
  ).toEqual(['Chicken breast, roasted', 'Chicken thigh']);
});

it('MM-627: a group listed with no words keeps reliability, then the stored order', () => {
  expect(ordered('', [hit(1, 'B', 'off', 0), hit(2, 'A', 'usda_foundation', 0)])).toEqual(['A', 'B']);
});

async function fixtureCatalog(): Promise<FoodCatalog> {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, FixturePack.header, FixturePack.entries);
  return new FoodCatalog([await SqliteFoodPack.open(db)]);
}

it('MM-627: a stray word finds the closest foods, marked as partial, never nothing', async () => {
  const catalog = await fixtureCatalog();
  const hits = await catalog.search('banana xyzzy');
  expect(hits.map((h) => h.food.name)).toEqual(['Banana']);
  expect(hits.every((h) => h.partial === true)).toBe(true);
  expect(await catalog.search('xyzzy'), 'one word that matches nothing finds nothing').toEqual([]);
});

it('MM-627: a full match drops the partial ones from every pack', async () => {
  const partialPack: FoodPack = {
    packId: 'q',
    search: () => Promise.resolve([{ ...hit(9, 'Bread', 'off'), partial: true }]),
    byBarcode: () => Promise.resolve(undefined),
    pairOf: () => Promise.resolve(undefined),
    foodById: () => Promise.resolve(undefined),
    servingsOf: () => Promise.resolve([]),
  };
  const catalog = new FoodCatalog([...(await fixtureCatalog()).packs, partialPack]);
  expect((await catalog.search('banana')).map((h) => h.food.name)).toEqual(['Banana']);
});

it('MM-627: each hit carries its first serving, and its row says it', async () => {
  const catalog = await fixtureCatalog();
  const [rice] = await catalog.search('white rice cooked');
  expect(rice?.firstServing).toEqual({ description: '1 cup', grams: 158 });
  expect(searchResultAmount(130, rice?.firstServing)).toBe('1 cup (158 g) · 205 kcal (130 per 100 g)');
  expect(searchResultAmount(130, undefined)).toBe('130 kcal per 100 g');
  expect(searchResultAmount(380, { description: '28.0 g', grams: 28 })).toBe('28 g · 106 kcal (380 per 100 g)');
});
