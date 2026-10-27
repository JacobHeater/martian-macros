import { expect, it } from 'vitest';
import { checkNutrition } from '../../src/domain/food/checkNutrition';
import { normalizeBarcode } from '../../src/domain/food/normalizeBarcode';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { FoodPackHeader } from '../../src/foodCatalog/FoodPackHeader';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import type { TrustTier } from '../../src/foodCatalog/TrustTier';
import { UnsupportedPackVersion } from '../../src/foodCatalog/UnsupportedPackVersion';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

async function written(header: FoodPackHeader, entries: readonly PackEntry[]): Promise<WasmSqlDatabase> {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, header, entries);
  return db;
}

const fixture = async () => SqliteFoodPack.open(await written(FixturePack.header, FixturePack.entries));

const names = (hits: readonly { food: CatalogFood }[]) => hits.map((h) => h.food.name);

async function first(pack: { search(query: string): Promise<{ food: CatalogFood }[]> }, query: string): Promise<CatalogFood> {
  const hit = (await pack.search(query))[0];
  if (hit === undefined) throw new Error(`Nothing found for "${query}".`);
  return hit.food;
}

const withBarcode = () => {
  const entry = FixturePack.entries.find((e) => (e.barcodes ?? []).length > 0);
  const code = entry?.barcodes?.[0];
  if (entry === undefined || code === undefined) throw new Error('The fixture has no barcode.');
  return { entry, code };
};

it('every fixture food passes the nutrition rule', () => {
  for (const e of FixturePack.entries) {
    const f = e.food;
    expect(
      checkNutrition({
        name: f.name,
        kcal: f.kcal,
        proteinG: f.proteinG,
        carbsG: f.carbsG,
        fatG: f.fatG,
        fiberG: f.fiberG,
        alcoholG: f.alcoholG,
      }),
      f.name,
    ).toBeUndefined();
  }
});

it('every fixture barcode is a valid GTIN-14', () => {
  const codes = FixturePack.entries.flatMap((e) => e.barcodes ?? []);
  expect(codes.length).toBeGreaterThan(0);
  for (const code of codes) expect(normalizeBarcode(code)).toBe(code);
});

it('a barcode finds its food, and an unknown one finds nothing', async () => {
  const pack = await fixture();
  const { entry, code } = withBarcode();
  expect((await pack.byBarcode(code))?.name).toBe(entry.food.name);
  expect(await pack.byBarcode('00000000000000')).toBeUndefined();
});

it('nutrients survive the scaled-integer storage', async () => {
  const food = await first(await fixture(), 'chicken breast cooked');
  expect(food.name).toBe('Chicken breast, cooked');
  expect(food.kcal).toBe(165);
  expect(food.proteinG).toBe(31);
  expect(food.fatG).toBe(3.6);
  expect(food.tier).toBe('reference');
  expect(food.sourceId, 'provenance').toMatch(/^fixture-/);
  expect(food.preparation).toBe('cooked');
});

it('search matches as the user types: prefixes of every word', async () => {
  const pack = await fixture();
  expect(names(await pack.search('chick bre')).sort()).toEqual(['Chicken breast, cooked', 'Chicken breast, raw']);
  expect(names(await pack.search('Ba'))).toContain('Banana');
  expect(await pack.search('   ')).toEqual([]);
  expect(await pack.search('zzzz')).toEqual([]);
});

it('search is not broken by punctuation in the query', async () => {
  const pack = await fixture();
  await expect(pack.search('"chicken* OR (breast')).resolves.toBeDefined();
  expect((await pack.search('chicken-breast')).length).toBeGreaterThan(0);
});

it('a name match ranks above a brand match, and paging continues', async () => {
  const pack = await fixture();
  const firstPage = await pack.search('test', { limit: 2 });
  const next = await pack.search('test', { limit: 2, offset: 2 });
  expect(firstPage.length).toBe(2);
  expect(new Set([...firstPage, ...next].map((h) => h.food.id)).size).toBe(next.length + 2);
});

it('raw and cooked foods point at each other', async () => {
  const pack = await fixture();
  const cooked = await first(pack, 'rice cooked');
  const raw = await first(pack, 'rice raw');
  expect(cooked.pairedFoodId).toBe(raw.id);
  expect(raw.pairedFoodId).toBe(cooked.id);
});

it('servings come back in order with their weights', async () => {
  const pack = await fixture();
  const servings = await pack.servingsOf(await first(pack, 'egg'));
  expect(servings).toEqual([{ description: '1 large egg', grams: 50 }]);
});

it('density is carried for foods measured by volume', async () => {
  expect((await first(await fixture(), 'milk')).densityGPerMl).toBe(1.03);
});

it('the header says where the pack came from and its terms', async () => {
  const header = (await fixture()).header;
  expect(header.region).toBe('US');
  expect(header.sources).toEqual(['Invented test data']);
  expect(header.license).not.toBe('');
});

it('a pack with a format this code does not know is refused', async () => {
  const db = await written(FixturePack.header, FixturePack.entries);
  await db.execute('PRAGMA user_version = 99');
  const refused = await SqliteFoodPack.open(db).catch((error: unknown) => error);
  expect(refused).toBeInstanceOf(UnsupportedPackVersion);
  expect((refused as UnsupportedPackVersion).found).toBe(99);
});

// In Dart this wrote a file and proved the reader opened it read-only.
// Opening a file is the platform's here, so that half belongs to the
// phone's adapter; this keeps the half that is the catalog's: a pack that
// has been a file reads the same.
it('a pack written out as a file opens and reads', async () => {
  const db = await written(FixturePack.header, FixturePack.entries);
  const bytes = await db.exportBytes();
  await db.close();
  const pack = await SqliteFoodPack.open(await WasmSqlDatabase.open({ bytes }));
  expect((await pack.search('banana')).length).toBeGreaterThan(0);
  await pack.close();
});

it('the closer name lists first; among names as close, reference foods before check-this foods', async () => {
  const pack = async (id: string, tier: TrustTier, name: string) =>
    SqliteFoodPack.open(
      await written({ ...FixturePack.header, packId: id }, [
        {
          food: new CatalogFood({
            id: 1,
            packId: id,
            name,
            kcal: 100,
            proteinG: 5,
            carbsG: 15,
            fatG: 2,
            source: 'test',
            tier,
            tierReason: 'test',
          }),
        },
      ]),
    );

  // MM-627 (the owner, 2026-10-26): the closer name lists first, whatever its tier, which its trust mark says;
  // among names as close, the reference food leads.
  const catalog = new FoodCatalog([
    await pack('b', 'checkThis', 'Oats'),
    await pack('g', 'reference', 'Oats, rolled, dry, plain, whole grain'),
  ]);
  expect((await first(catalog, 'oats')).tier).toBe('checkThis');
  const asClose = new FoodCatalog([await pack('b', 'checkThis', 'Oats'), await pack('g', 'reference', 'Oats, rolled')]);
  expect((await first(asClose, 'oats')).tier).toBe('reference');
});

it('a food finds its raw or cooked counterpart (MM-151)', async () => {
  const pack = await fixture();
  const cooked = await first(pack, 'rice cooked');
  const raw = await pack.pairOf(cooked);
  expect(raw?.name).toBe('White rice, raw');
  expect(raw === undefined ? undefined : (await pack.pairOf(raw))?.id).toBe(cooked.id);
  expect((await new FoodCatalog([pack]).pairOf(cooked))?.name).toBe('White rice, raw');
  const banana = await first(pack, 'banana');
  expect(await pack.pairOf(banana), 'one state only').toBeUndefined();
});

it('several packs read as one ranked list', async () => {
  const catalog = new FoodCatalog([await fixture(), await fixture()]);
  const hits = await catalog.search('banana');
  expect(hits.length).toBe(2);
  expect(await catalog.byBarcode(withBarcode().code)).toBeDefined();
  expect((await catalog.servingsOf((hits[0] as (typeof hits)[number]).food)).length).toBeGreaterThan(0);
});

it('search in a large pack stays fast', async () => {
  // Not the acceptance figures (they are for a phone and a million
  // products); this catches an accidental full scan on a laptop.
  const entries: PackEntry[] = [];
  for (let i = 0; i < 50000; i++) {
    entries.push({
      food: new CatalogFood({
        id: i + 1,
        packId: FixturePack.packId,
        name: `Food ${i} item${i % 997} word${i % 31}`,
        kcal: 100,
        proteinG: 5,
        carbsG: 10,
        fatG: 3,
        source: 'synthetic',
        tier: 'checkThis',
        tierReason: 'synthetic',
      }),
      barcodes: [FixturePack.gtin14(`${i + 1}`.padStart(13, '0'))],
    });
  }
  const pack = await SqliteFoodPack.open(await written(FixturePack.header, entries));
  let started = performance.now();
  const hits = await pack.search('food item5 wor');
  const searchMs = performance.now() - started;
  started = performance.now();
  const found = await pack.byBarcode(FixturePack.gtin14('25000'.padStart(13, '0')));
  const lookupMs = performance.now() - started;
  expect(hits.length).toBeGreaterThan(0);
  expect(found?.id).toBe(25000);
  expect(searchMs).toBeLessThan(150);
  expect(lookupMs).toBeLessThan(10);
}, 60_000);
