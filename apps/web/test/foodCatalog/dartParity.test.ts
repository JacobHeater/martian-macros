import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { PreparationState } from '../../src/foodCatalog/PreparationState';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import recorded from './support/dartFixturePack.json';

/**
 * MM-231: the pack format did not change in the move. `dartFixture.pack` is
 * the fixture pack as the Dart writer wrote it, and `dartFixturePack.json`
 * is what the Dart reader then said: every food, and the ids and scores of
 * ten searches. Both were written by the Dart package on 2026-10-12.
 */
const dartPack = async () =>
  SqliteFoodPack.open(
    await WasmSqlDatabase.open({ bytes: new Uint8Array(readFileSync('test/foodCatalog/support/dartFixture.pack')) }),
  );

const hitsOf = async (pack: SqliteFoodPack, query: string) =>
  (await pack.search(query)).map((h) => ({ id: h.food.id, score: h.score }));

it('a pack the Dart writer wrote is searched as the Dart reader searched it', async () => {
  const pack = await dartPack();
  expect(Object.keys(recorded.searches).length).toBe(10);
  for (const [query, hits] of Object.entries(recorded.searches)) {
    expect(await hitsOf(pack, query), query).toEqual(hits);
  }
  await pack.close();
});

it('a pack this writer wrote is searched the same, scores and all', async () => {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, FixturePack.header, FixturePack.entries);
  const pack = await SqliteFoodPack.open(db);
  for (const [query, hits] of Object.entries(recorded.searches)) {
    expect(await hitsOf(pack, query), query).toEqual(hits);
  }
  await pack.close();
});

it('the fixture foods are the ones the Dart fixture holds', () => {
  const ours = FixturePack.entries.map((e) => ({
    id: e.food.id,
    name: e.food.name,
    brand: e.food.brand ?? null,
    kcal: e.food.kcal,
    proteinG: e.food.proteinG,
    carbsG: e.food.carbsG,
    fatG: e.food.fatG,
    fiberG: e.food.fiberG ?? null,
    alcoholG: e.food.alcoholG ?? null,
    densityGPerMl: e.food.densityGPerMl ?? null,
    preparation: e.food.preparation,
    pairedFoodId: e.food.pairedFoodId ?? null,
    tier: e.food.tier,
    sourceId: e.food.sourceId ?? null,
    servings: e.servings ?? [],
    barcodes: e.barcodes ?? [],
  }));
  expect(ours).toEqual(recorded.foods);
});

it('every food in the Dart pack reads back as the Dart fixture states it', async () => {
  const pack = await dartPack();
  for (const stated of recorded.foods) {
    const found = (await pack.search(stated.name, { limit: 50 })).find((h) => h.food.id === stated.id)?.food;
    expect(found, stated.name).toBeDefined();
    if (found === undefined) continue;
    expect(
      {
        name: found.name,
        brand: found.brand ?? null,
        kcal: found.kcal,
        proteinG: found.proteinG,
        carbsG: found.carbsG,
        fatG: found.fatG,
        fiberG: found.fiberG ?? null,
        alcoholG: found.alcoholG ?? null,
        densityGPerMl: found.densityGPerMl ?? null,
        preparation: found.preparation,
        pairedFoodId: found.pairedFoodId ?? null,
        tier: found.tier,
        sourceId: found.sourceId ?? null,
        servings: await pack.servingsOf(found),
      },
      stated.name,
    ).toEqual({
      name: stated.name,
      brand: stated.brand,
      kcal: stated.kcal,
      proteinG: stated.proteinG,
      carbsG: stated.carbsG,
      fatG: stated.fatG,
      fiberG: stated.fiberG,
      alcoholG: stated.alcoholG,
      densityGPerMl: stated.densityGPerMl,
      preparation: stated.preparation,
      pairedFoodId: stated.pairedFoodId,
      tier: stated.tier,
      sourceId: stated.sourceId,
      servings: stated.servings,
    });
    expect(PreparationState.values).toContain(found.preparation);
    for (const code of stated.barcodes) expect((await pack.byBarcode(code))?.id).toBe(stated.id);
  }
  await pack.close();
});
