import { expect, it } from 'vitest';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/** MM-638: a word mistyped after its first letters still finds what it meant, as the closest, in the list the person reads. */
async function fixtureCatalog(): Promise<FoodCatalog> {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, FixturePack.header, FixturePack.entries);
  return new FoodCatalog([await SqliteFoodPack.open(db)]);
}

it('MM-638: "chickn" finds chicken, marked as the closest', async () => {
  const hits = await (await fixtureCatalog()).search('chickn', { closest: true });
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every((hit) => hit.food.name.toLowerCase().startsWith('chicken'))).toBe(true);
  expect(hits.every((hit) => hit.partial === true)).toBe(true);
});

it('MM-638: "chickn breats" finds chicken breast, by every word’s first letters', async () => {
  const hits = await (await fixtureCatalog()).search('chickn breats', { closest: true });
  expect(hits.map((hit) => hit.food.name).every((name) => /^Chicken breast/.test(name))).toBe(true);
});

it('MM-638: a lookup that takes the first hit never gets a mistyped match', async () => {
  expect(await (await fixtureCatalog()).search('chickn', { limit: 1 })).toEqual([]);
});

it('MM-638: a short word that matches nothing still finds nothing', async () => {
  expect(await (await fixtureCatalog()).search('zzqx', { closest: true })).toEqual([]);
});
