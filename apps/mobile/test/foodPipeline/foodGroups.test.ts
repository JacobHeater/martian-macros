import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FoodGroup } from '../../src/domain/food/FoodGroup';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { FoodPackFormat } from '../../src/foodCatalog/FoodPackFormat';
import { InMemoryOnlineFoodCache } from '../../src/foodCatalog/online/InMemoryOnlineFoodCache';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { CandidateFood } from '../../src/foodPipeline/CandidateFood';
import { candidateFromRow } from '../../src/foodPipeline/candidateFromRow';
import { categoryKey } from '../../src/foodPipeline/categoryKey';
import { foodGroupOf } from '../../src/foodPipeline/foodGroupOf';
import { foodGroupRefinements } from '../../src/foodPipeline/foodGroupRefinements';
import { foodGroupTable } from '../../src/foodPipeline/foodGroupTable';
import { PackBuilder } from '../../src/foodPipeline/PackBuilder';
import { PreferredSourcePolicy } from '../../src/foodPipeline/PreferredSourcePolicy';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/** MM-616: catalog foods carry a food group, mapped in the pipeline from the source's category. */

const builder = () => new PackBuilder({ policy: new PreferredSourcePolicy('usda_branded') });

const branded = (sourceId: string, name: string, category: string | undefined, barcodeBody: string) =>
  new CandidateFood({
    source: 'usda_branded',
    sourceId,
    kind: 'barcode',
    name,
    brand: 'Test Brand',
    rawBarcode: FixturePack.gtin14(barcodeBody),
    kcal: 431,
    proteinG: 10,
    carbsG: 64,
    fatG: 15,
    category,
  });

const generic = (sourceId: string, name: string, category: string | undefined) =>
  new CandidateFood({
    source: 'usda_sr_legacy',
    sourceId,
    kind: 'generic',
    name,
    kcal: 143,
    proteinG: 12.6,
    carbsG: 0.7,
    fatG: 9.9,
    category,
  });

async function packFrom(entries: readonly PackEntry[], packId = 'barcode_us'): Promise<SqliteFoodPack> {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, { ...FixturePack.header, packId }, entries);
  return SqliteFoodPack.open(db);
}

const food = (id: number, name: string, group: FoodGroup | undefined, packId = 'groups'): PackEntry => ({
  food: new CatalogFood({
    id,
    packId,
    name,
    kcal: 100,
    proteinG: 5,
    carbsG: 10,
    fatG: 4.4,
    source: 'fixture',
    tier: 'reference',
    tierReason: 'Test data, not a nutrition source.',
    group,
  }),
});

describe('the mapping', () => {
  it('a branded granola in "Cereal" is in the breakfast cereals group, in the pack', async () => {
    const { barcode } = await builder().build([branded('1', 'Honey almond granola', 'Cereal', '0000100000011')]);
    expect(barcode[0]?.food.group).toBe('breakfastCereals');
    const hit = (await (await packFrom(barcode)).search('granola'))[0];
    expect(hit?.food.group).toBe('breakfastCereals');
  });

  it('spacing and dashes in a category do not matter', () => {
    expect(categoryKey('Fish  Prepared/Processed')).toBe(categoryKey('Fish – Prepared/Processed'));
    expect(foodGroupOf('Fish  Prepared/Processed', 'Salmon fillets')).toBe('fish');
    expect(foodGroupOf('  cereal ', 'Granola')).toBe('breakfastCereals');
  });

  it('a USDA category holding two groups is split by the name', () => {
    expect(foodGroupOf('Dairy and Egg Products', 'Egg, whole, raw, fresh')).toBe('eggs');
    expect(foodGroupOf('Dairy and Egg Products', 'Eggnog')).toBe('dairyAndYogurt');
    expect(foodGroupOf('Dairy and Egg Products', 'Milk, whole, 3.25% milkfat')).toBe('dairyAndYogurt');
    expect(foodGroupOf('Fruits and Fruit Juices', 'Orange juice, raw')).toBe('drinks');
    expect(foodGroupOf('Fruits and Fruit Juices', 'Apples, raw, with skin')).toBe('fruit');
    expect(foodGroupOf('Baked Products', 'Cookies, chocolate chip, commercially prepared')).toBe('snacksAndSweets');
    expect(foodGroupOf('Baked Products', 'Bread, whole-wheat, commercially prepared')).toBe('breadsAndGrains');
  });

  it('a category reviewed as having no group, or no category at all, gives no group', () => {
    expect(foodGroupOf('Vitamins', 'Vitamin C gummies')).toBeUndefined();
    expect(foodGroupOf(undefined, 'Granola')).toBeUndefined();
  });

  it('the table names each category once, every group has categories, and every refinement is of a listed category', () => {
    const keys = foodGroupTable.flatMap((row) => row.categories.map(categoryKey));
    expect(keys.filter((key, i) => keys.indexOf(key) !== i)).toEqual([]);
    for (const group of FoodGroup.values) {
      expect(foodGroupTable.some((row) => row.group === group && row.categories.length > 0)).toBe(true);
    }
    for (const refinement of foodGroupRefinements) expect(keys).toContain(categoryKey(refinement.category));
  });

  it('an extract row carries its category', () => {
    const header = ['source', 'source_id', 'kind', 'name', 'kcal', 'protein', 'carbs', 'fat', 'category'];
    const c = candidateFromRow(header, ['usda_branded', '1', 'barcode', 'Granola', '431', '10', '64', '15', 'Cereal']);
    expect(c.category).toBe('Cereal');
    expect(candidateFromRow(header.slice(0, -1), ['usda_branded', '1', 'barcode', 'Granola', '431', '10', '64', '15']).category).toBeUndefined();
  });

  it('both files of the extract end with the category', () => {
    const sql = readFileSync(new URL('../../src/foodPipeline/node/extract.sql', import.meta.url), 'utf8');
    expect(sql).toContain('bf.branded_food_category');
    expect(sql).toContain("'{{cache}}/usda_sr_legacy/food_category.csv'");
    expect(sql).toContain("'{{cache}}/usda_foundation/food_category.csv'");
    expect(sql).toContain("'{{cache}}/usda_fndds/wweia_food_category.csv'");
    expect(sql.match(/AS category\b/g)?.length).toBe(2);
  });
});

describe('unmapped categories', () => {
  it('a food whose category is in no row has no group, and the report lists the category', async () => {
    const { barcode, generic: genericFoods, report } = await builder().build([
      branded('1', 'Honey almond granola', 'Cereal', '0000100000011'),
      branded('2', 'Moon cheese crisps', 'Lunar Snacks', '0000100000028'),
      branded('3', 'Moon cheese bites', 'Lunar Snacks', '0000100000035'),
      branded('4', 'Vitamin gummies', 'Vitamins', '0000100000042'),
      generic('5', 'Egg, whole, raw, fresh', 'Dairy and Egg Products'),
    ]);
    const groupOf = (name: string) => [...barcode, ...genericFoods].find((e) => e.food.name === name)?.food.group;
    expect(groupOf('Moon cheese crisps')).toBeUndefined();
    expect(groupOf('Vitamin gummies')).toBeUndefined();
    expect(groupOf('Egg, whole, raw, fresh')).toBe('eggs');
    expect([...report.unmappedCategories.entries()]).toEqual([['usda_branded: Lunar Snacks', 2]]);
    const text = report.format();
    expect(text).toContain('unmapped source categories (no group; add them to foodGroupTable): 1\n    usda_branded: Lunar Snacks: 2\n');
    expect(text).toContain('    breakfastCereals: 1\n');
    expect(text).toContain('    none: 3\n');
    // A category reviewed as having no group is not unmapped.
    expect(text).not.toContain('Vitamins');
  });

  it('an extract without categories reports as it did', async () => {
    const { report } = await builder().build([branded('1', 'Granola', undefined, '0000100000011')]);
    expect(report.format()).not.toContain('food groups');
    expect(report.unmappedCategories.size).toBe(0);
  });
});

describe('the pack', () => {
  it('format 4 carries the group', () => {
    expect(FoodPackFormat.version).toBe(5);
    expect(FoodPackFormat.schema).toContain('food_group TEXT');
  });

  it('a format 3 pack still reads: its foods have no group, and none is in a group', async () => {
    const db = await WasmSqlDatabase.open();
    await writeFoodPack(db, { ...FixturePack.header, packId: 'old' }, [food(1, 'Granola', 'breakfastCereals', 'old')]);
    await db.execute('DROP INDEX foods_by_group');
    await db.execute('ALTER TABLE foods DROP COLUMN food_group');
    await db.execute('PRAGMA user_version = 3');
    const pack = await SqliteFoodPack.open(db);
    expect(pack.header.formatVersion).toBe(3);
    const hit = (await pack.search('granola'))[0];
    expect(hit?.food.name).toBe('Granola');
    expect(hit?.food.group).toBeUndefined();
    expect(await pack.search('granola', { group: 'breakfastCereals' })).toEqual([]);
    expect(await pack.search('', { group: 'breakfastCereals' })).toEqual([]);
  });

  it('a group the code does not know reads as no group', async () => {
    const db = await WasmSqlDatabase.open();
    await writeFoodPack(db, { ...FixturePack.header, packId: 'odd' }, [food(1, 'Granola', 'breakfastCereals', 'odd')]);
    await db.execute("UPDATE foods SET food_group = 'moonRocks'");
    const hit = (await (await SqliteFoodPack.open(db)).search('granola'))[0];
    expect(hit?.food.group).toBeUndefined();
  });
});

describe('the search filter', () => {
  const entries = [
    food(1, 'Granola, honey almond', 'breakfastCereals'),
    food(2, 'Granola bar, chewy', 'snacksAndSweets'),
    food(3, 'Tuna, canned in water', 'fish'),
    food(4, 'Oat granola clusters', 'breakfastCereals'),
    food(5, 'Granola, unknown kind', undefined),
  ];

  it('only foods in the group are returned', async () => {
    const pack = await packFrom(entries, 'groups');
    const names = (await pack.search('granola', { group: 'breakfastCereals' })).map((h) => h.food.name).sort();
    expect(names).toEqual(['Granola, honey almond', 'Oat granola clusters']);
    expect((await pack.search('granola')).length).toBe(4);
    expect(await pack.search('tuna', { group: 'breakfastCereals' })).toEqual([]);
  });

  it('a query with no words lists the foods of the group, and honors the limit and offset', async () => {
    const pack = await packFrom(entries, 'groups');
    expect((await pack.search('', { group: 'breakfastCereals' })).map((h) => h.food.id)).toEqual([1, 4]);
    expect((await pack.search(' ', { group: 'breakfastCereals', limit: 1, offset: 1 })).map((h) => h.food.id)).toEqual([4]);
    expect(await pack.search('')).toEqual([]);
  });

  it('the catalog filters every pack, and a food found online is in no group', async () => {
    const online = new InMemoryOnlineFoodCache();
    await online.remember(food(9, 'Granola, found online', 'breakfastCereals', 'anything'));
    const catalog = new FoodCatalog([await packFrom(entries, 'groups'), online]);
    expect((await catalog.search('granola')).length).toBe(5);
    const hits = await catalog.search('granola', { group: 'breakfastCereals' });
    expect(hits.map((h) => h.food.name).sort()).toEqual(['Granola, honey almond', 'Oat granola clusters']);
    expect(hits.every((h) => h.food.group === 'breakfastCereals')).toBe(true);
  });
});
