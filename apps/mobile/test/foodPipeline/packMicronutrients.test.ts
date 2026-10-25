import { expect, it } from 'vitest';
import { Micronutrient } from '../../src/domain/food/micros/Micronutrient';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodPackFormat } from '../../src/foodCatalog/FoodPackFormat';
import { PackMicronutrient } from '../../src/foodCatalog/PackMicronutrient';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { CandidateFood } from '../../src/foodPipeline/CandidateFood';
import { candidateFromRow } from '../../src/foodPipeline/candidateFromRow';
import { PackBuilder } from '../../src/foodPipeline/PackBuilder';
import { PreferredSourcePolicy } from '../../src/foodPipeline/PreferredSourcePolicy';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/** MM-307: the pack carries micronutrients, keeps unknown unknown, and still opens a format 1 pack. */

const banana = (micros: CandidateFood['micros']) =>
  new CandidateFood({
    source: 'usda_foundation',
    sourceId: '1105314',
    kind: 'generic',
    name: 'Bananas, raw',
    kcal: 97,
    proteinG: 0.7,
    carbsG: 23,
    fatG: 0.3,
    sodiumMg: 1,
    micros,
  });

async function packOf(food: CandidateFood): Promise<SqliteFoodPack> {
  const { generic } = await new PackBuilder({ policy: new PreferredSourcePolicy('usda_foundation') }).build([food]);
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, { ...FixturePack.header, packId: 'generic' }, generic);
  return SqliteFoodPack.open(db);
}

async function readBack(food: CandidateFood) {
  const hit = (await (await packOf(food)).search('banana'))[0];
  if (hit === undefined) throw new Error('The banana was not found.');
  return hit.food;
}

it('the pack keeps the same thirteen nutrients as the domain, sodium apart', () => {
  expect(PackMicronutrient.values).toEqual(Micronutrient.added);
  for (const n of PackMicronutrient.values) expect(PackMicronutrient.column(n)).toBe(Micronutrient.column(n));
});

it('a food keeps its micronutrients through the pack', async () => {
  const food = await readBack(banana({ potassium: 358, vitaminC: 8.7, folate: 20 }));
  expect(food.micros.potassium).toBe(358);
  expect(food.micros.vitaminC).toBe(8.7);
  expect(food.micros.folate).toBe(20);
});

it('a nutrient the source left out stays unknown, not zero', async () => {
  const food = await readBack(banana({ potassium: 358 }));
  expect(food.micros.calcium).toBeUndefined();
  expect('calcium' in food.micros).toBe(false);
});

it('an implausible value is dropped and the food kept', async () => {
  const food = await readBack(banana({ iron: 5000, potassium: 358 }));
  expect(food.name).toBe('Bananas, raw');
  expect(food.micros.iron).toBeUndefined();
  expect(food.micros.potassium).toBe(358);
});

it('a format 1 pack still opens; its foods have no micronutrients', async () => {
  const { generic } = await new PackBuilder({ policy: new PreferredSourcePolicy('usda_foundation') }).build([
    banana({ potassium: 358 }),
  ]);
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, { ...FixturePack.header, packId: 'generic' }, generic);
  for (const n of PackMicronutrient.values) await db.execute(`ALTER TABLE foods DROP COLUMN ${PackMicronutrient.column(n)}`);
  await db.execute('ALTER TABLE foods DROP COLUMN sugar_alcohols');
  await db.execute('PRAGMA user_version = 1');
  const pack = await SqliteFoodPack.open(db);
  expect(pack.header.formatVersion).toBe(1);
  const hit = (await pack.search('banana'))[0];
  expect(hit?.food.sodiumMg).toBe(1);
  expect(hit?.food.micros).toEqual({});
  expect(FoodPackFormat.version).toBe(4);
});

// MM-397: format 3 carries sugar alcohols; a format 2 pack opens with its micronutrients and none.
it('a format 3 pack carries sugar alcohols, and a format 2 pack opens without them', async () => {
  const sweet = new CandidateFood({ ...banana({ potassium: 358 }), sugarAlcoholsG: 4 });
  expect((await readBack(sweet)).sugarAlcoholsG).toBe(4);
  const { generic } = await new PackBuilder({ policy: new PreferredSourcePolicy('usda_foundation') }).build([sweet]);
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, { ...FixturePack.header, packId: 'generic' }, generic);
  await db.execute('ALTER TABLE foods DROP COLUMN sugar_alcohols');
  await db.execute('PRAGMA user_version = 2');
  const pack = await SqliteFoodPack.open(db);
  const hit = (await pack.search('banana'))[0];
  expect(hit?.food.sugarAlcoholsG).toBeUndefined();
  expect(hit?.food.micros.potassium).toBe(358);
});

it('the build report counts the foods stating each nutrient', async () => {
  const { report } = await new PackBuilder({ policy: new PreferredSourcePolicy('usda_foundation') }).build([
    banana({ potassium: 358 }),
  ]);
  expect(report.stating.get('potassium_mg')).toBe(1);
  expect(report.stating.get('sodium_mg')).toBe(1);
  expect(report.stating.get('calcium_mg')).toBeUndefined();
  expect(report.formatCoverage()).toContain('potassium_mg: 1 (100%)');
  expect(report.formatCoverage()).toContain('calcium_mg: 0 (0%)');
});

it('an extract row with the micronutrient columns becomes a candidate with them', () => {
  const header = ['source', 'source_id', 'kind', 'name', 'kcal', 'protein', 'carbs', 'fat', 'potassium_mg', 'vitamin_d_ug'];
  const c = candidateFromRow(header, ['usda_foundation', '1', 'generic', 'Milk', '61', '3.2', '4.8', '3.3', '150', '1.3']);
  expect(c.micros.potassium).toBe(150);
  expect(c.micros.vitaminD).toBe(1.3);
  expect(c.micros.calcium).toBeUndefined();
});
