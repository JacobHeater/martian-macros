import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkNutrition } from '../../src/domain/food/checkNutrition';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodPackFormat } from '../../src/foodCatalog/FoodPackFormat';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { CandidateFood } from '../../src/foodPipeline/CandidateFood';
import { candidateFromRow } from '../../src/foodPipeline/candidateFromRow';
import { PackBuilder } from '../../src/foodPipeline/PackBuilder';
import { PreferredSourcePolicy } from '../../src/foodPipeline/PreferredSourcePolicy';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/**
 * MM-650: a liquid is stated per 100 mL, with its serving in millilitres,
 * from the extract through the pack (format 5); an older pack still reads,
 * per 100 g with servings by weight.
 */
const sql = readFileSync(new URL('../../src/foodPipeline/node/extract.sql', import.meta.url), 'utf8');
const header = ['source', 'source_id', 'kind', 'name', 'brand', 'gtin', 'kcal', 'protein', 'carbs', 'fat', 'servings', 'basis'];
const cola = FixturePack.gtin14('0000100000011');

const colaRow = (basis: string, servings: string) =>
  candidateFromRow(header, ['usda_branded', '1105904', 'barcode', 'COLA', 'Fizz Co', cola, '39', '0', '10.6', '0', servings, basis]);

describe('the candidate (MM-650)', () => {
  it('a Branded row served in millilitres is per 100 mL, its serving a volume with no weight', () => {
    const food = colaRow('ml', '[{"d":"1 Can (355 mL)","ml":355}]');
    expect(food.basis).toBe('per100ml');
    expect(food.servings).toEqual([{ description: '1 Can (355 mL)', milliliters: 355 }]);
    expect(food.servings[0]?.grams).toBeUndefined();
  });

  it('a row with no basis, or any other, is per 100 g; a serving with neither grams nor millilitres is none', () => {
    expect(colaRow('g', '[{"d":"1 pot (125 g)","g":125}]').basis).toBe('per100g');
    expect(candidateFromRow(header.slice(0, -1), ['off', '1', 'barcode', 'Juice', '', cola, '46', '0', '10', '0', '[]']).basis).toBe('per100g');
    expect(colaRow('ml', '[{"d":"1 can"},{"d":"bad","ml":0}]').servings).toEqual([]);
  });

  it('the nutrition rule lets a syrup weigh more than 100 g per 100 mL, and no more than honey', () => {
    const syrup = { name: 'Corn syrup', kcal: 400, proteinG: 0, carbsG: 105, fatG: 0 };
    expect(checkNutrition(syrup)).toBe('macrosExceed100g');
    expect(checkNutrition(syrup, { basis: 'per100ml' })).toBeUndefined();
    expect(checkNutrition({ ...syrup, carbsG: 151, kcal: 604 }, { basis: 'per100ml' })).toBe('macrosExceed100g');
  });
});

describe('the pack (MM-650)', () => {
  const branded = new CandidateFood({
    source: 'usda_branded',
    sourceId: '1105904',
    kind: 'barcode',
    name: 'Cola',
    brand: 'Fizz Co',
    rawBarcode: cola,
    kcal: 39,
    proteinG: 0,
    carbsG: 10.6,
    fatG: 0,
    sodiumMg: 4,
    micros: { sugars: 10.6 },
    basis: 'per100ml',
    servings: [{ description: '1 Can (355 mL)', milliliters: 355 }],
    updatedAt: 1_700_000_000,
  });
  const builder = () => new PackBuilder({ policy: new PreferredSourcePolicy('usda_branded') });
  const drinks = () => builder().build([branded]);

  it('the same barcode in both sources keeps the winner whole: its basis and its servings (the panel\'s IN-5)', async () => {
    const off = new CandidateFood({
      source: 'off',
      sourceId: cola,
      kind: 'barcode',
      name: 'Cola',
      rawBarcode: cola,
      kcal: 42,
      proteinG: 0,
      carbsG: 10.6,
      fatG: 0,
      servings: [{ description: '1 cup (240 g)', grams: 240 }],
      updatedAt: 1_700_000_000,
    });
    const { barcode } = await builder().build([branded, off]);
    expect(barcode).toHaveLength(1);
    expect(barcode[0]?.food.basis).toBe('per100ml');
    expect(barcode[0]?.servings).toEqual([{ description: '1 Can (355 mL)', milliliters: 355 }]);
  });

  it('a syrup stated per 100 mL keeps sugars above 100 g (the panel\'s IN-6)', async () => {
    const syrup = new CandidateFood({ ...branded, sourceId: '2', rawBarcode: undefined, kind: 'generic', name: 'Corn syrup', kcal: 420, carbsG: 108, micros: { sugars: 106 } });
    const { generic } = await builder().build([syrup]);
    expect(generic[0]?.food.micros.sugars).toBe(106);
    const solid = new CandidateFood({ ...syrup, basis: 'per100g', carbsG: 99, kcal: 396, micros: { sugars: 101 } });
    expect((await builder().build([solid])).generic[0]?.food.micros.sugars).toBeUndefined();
  });

  it('format 5 carries the basis and a serving in millilitres', async () => {
    expect(FoodPackFormat.version).toBe(5);
    expect(FoodPackFormat.schema).toContain("basis TEXT NOT NULL DEFAULT 'g'");
    expect(FoodPackFormat.schema).toContain('milliliters INTEGER');
    const { barcode } = await drinks();
    expect(barcode[0]?.food.basis).toBe('per100ml');
    const db = await WasmSqlDatabase.open();
    await writeFoodPack(db, { ...FixturePack.header, packId: 'drinks' }, barcode);
    const pack = await SqliteFoodPack.open(db);
    const found = await pack.byBarcode(cola);
    expect(found?.basis).toBe('per100ml');
    expect(found?.kcal).toBe(39);
    expect(found === undefined ? [] : await pack.servingsOf(found)).toEqual([{ description: '1 Can (355 mL)', milliliters: 355 }]);
    const hit = (await pack.search('cola'))[0];
    expect(hit?.firstServing).toEqual({ description: '1 Can (355 mL)', milliliters: 355 });
    expect(hit?.firstServing?.grams).toBeUndefined();
    await pack.close();
  });

  it('a format 4 pack still reads: every food per 100 g, every serving a weight', async () => {
    const db = await WasmSqlDatabase.open();
    await writeFoodPack(db, { ...FixturePack.header, packId: 'old' }, FixturePack.entries);
    await db.execute('ALTER TABLE foods DROP COLUMN basis');
    await db.execute('ALTER TABLE servings DROP COLUMN milliliters');
    await db.execute('PRAGMA user_version = 4');
    const pack = await SqliteFoodPack.open(db);
    expect(pack.header.formatVersion).toBe(4);
    const hit = (await pack.search('egg'))[0];
    expect(hit?.food.basis).toBe('per100g');
    expect(hit?.firstServing).toEqual({ description: '1 large egg', grams: 50 });
    expect(hit === undefined ? [] : await pack.servingsOf(hit.food)).toEqual([{ description: '1 large egg', grams: 50 }]);
    await pack.close();
  });

  it('a serving with neither grams nor millilitres is refused by the writer, not written as nothing', async () => {
    const db = await WasmSqlDatabase.open();
    const [first] = FixturePack.entries;
    const broken: PackEntry = { ...(first as PackEntry), servings: [{ description: '1 glass' }] };
    await expect(writeFoodPack(db, { ...FixturePack.header, packId: 'broken' }, [broken])).rejects.toThrow(/neither grams nor millilitres/);
  });
});

describe('the extract (MM-650)', () => {
  it('USDA Branded: a serving in ml or MLT is written in millilitres and the row is per 100 mL; gm joins the grams', () => {
    expect(sql).toMatch(/lower\(bf\.serving_size_unit\) IN \('g', 'grm', 'gm'\)/);
    expect(sql).toMatch(/lower\(bf\.serving_size_unit\) IN \('ml', 'mlt'\)[\s\S]*'ml': try_cast\(bf\.serving_size AS DOUBLE\)/);
    expect(sql).toMatch(/IN \('ml', 'mlt'\) THEN 'ml' ELSE 'g' END AS basis/);
  });

  it('Open Food Facts: a serving is millilitres when its text states them as the quantity, or its fluid ounces convert to it', () => {
    expect(sql).toContain("regexp_extract(serving_size, '(?i)([0-9]+(?:[.,][0-9]+)?)\\s*ml\\b', 1), ',', '.') AS DOUBLE), -1)");
    expect(sql).toContain("regexp_extract(serving_size, '(?i)([0-9]+(?:[.,][0-9]+)?)\\s*fl\\.?\\s*oz', 1), ',', '.') AS DOUBLE), -1) * 29.5735295625");
    expect(sql).toContain("THEN to_json([{'d': serving_size, 'ml': serving_ml}])");
    expect(sql).toContain("CASE WHEN serving_ml IS NOT NULL THEN 'ml' ELSE 'g' END");
  });

  it('generic foods are per 100 g', () => {
    expect(sql).toMatch(/'g' AS basis\s+FROM fd/);
  });
});
