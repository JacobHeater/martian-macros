import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import { CatalogTradeCatalog } from '../../src/state/CatalogTradeCatalog';
import { type TradeCatalogSeed, tradeCatalogContract, tradeCatalogPackId } from '../contracts/tradeCatalogContract';

/** MM-607: the trade's catalog over the installed packs, read ahead of time. */

/** A seed as a pack states it: per 100 g, with its default serving. */
function packEntryOf(seed: TradeCatalogSeed): PackEntry {
  const per100 = 100 / seed.grams;
  return {
    food: new CatalogFood({
      id: seed.foodId,
      packId: seed.packId,
      name: seed.name,
      kcal: seed.kcal * per100,
      proteinG: seed.proteinG * per100,
      carbsG: seed.carbsG * per100,
      fatG: seed.fatG * per100,
      sodiumMg: seed.sodiumMg === undefined ? undefined : seed.sodiumMg * per100,
      source: 'fixture',
      tier: 'reference',
      tierReason: 'Test data, not a nutrition source.',
      group: seed.group,
    }),
    servings: [{ description: '1 serving', grams: seed.grams }],
  };
}

/** An entry logged from a catalog food (or a saved one, with `custom`). */
function loggedFrom(packId: string, foodId: number): FoodEntry {
  return new FoodEntry({
    id: foodId,
    date: CalendarDate.of(2026, 10, 20),
    meal: 'breakfast',
    name: `Food ${foodId}`,
    kcal: 100,
    proteinG: 5,
    carbsG: 12,
    fatG: 2,
    source: 'labelServing',
    portion: {
      method: 'labelServing',
      basis: 'calculated',
      quantity: 1,
      unit: 'serving',
      reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 100, proteinG: 5, carbsG: 12, fatG: 2 }) },
      origin: { packId, foodId, source: 'fixture' },
    },
  });
}

async function catalogOf(entries: readonly PackEntry[]): Promise<FoodCatalog> {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, { ...FixturePack.header, packId: tradeCatalogPackId }, entries);
  return new FoodCatalog([await SqliteFoodPack.open(db)]);
}

tradeCatalogContract('Over the food catalog', async (seeds) => {
  const catalog = await catalogOf(seeds.map(packEntryOf));
  return CatalogTradeCatalog.load(
    catalog,
    seeds.map((s) => loggedFrom(s.packId, s.foodId)),
  );
});

it('lists the groups of the foods logged and the protein groups (MM-684), and a food with no serving at 100 g', async () => {
  const cereal = packEntryOf({
    packId: tradeCatalogPackId,
    foodId: 1,
    name: 'Granola',
    group: 'breakfastCereals',
    grams: 100,
    kcal: 450,
    proteinG: 10,
    carbsG: 60,
    fatG: 18,
    sodiumMg: 20,
  });
  const bran = { ...packEntryOf(seedOf(2, 'Bran flakes')), servings: [] };
  const tuna = packEntryOf({ ...seedOf(3, 'Tuna'), group: 'fish' });
  const catalog = await catalogOf([cereal, bran, tuna]);
  const trades = await CatalogTradeCatalog.load(catalog, [loggedFrom(tradeCatalogPackId, 1), loggedFrom('custom', 3)]);
  expect(trades.groupOf({ packId: tradeCatalogPackId, foodId: 1 })).toBe('breakfastCereals');
  // Not logged from the catalog, so its group was never looked up.
  expect(trades.groupOf({ packId: tradeCatalogPackId, foodId: 3 })).toBeUndefined();
  // Fish is a protein group: read whether or not the person logged from it, for a lean protein food to add (MM-684).
  expect(trades.candidatesIn('fish', { minKcal: 0, maxKcal: undefined }).map((f) => f.name)).toEqual(['Tuna']);
  const listed = trades.candidatesIn('breakfastCereals', { minKcal: 0, maxKcal: undefined });
  expect(listed.map((f) => [f.name, f.grams]).sort()).toEqual([
    ['Bran flakes', 100],
    ['Granola', 100],
  ]);
});

function seedOf(foodId: number, name: string): TradeCatalogSeed {
  return {
    packId: tradeCatalogPackId,
    foodId,
    name,
    group: 'breakfastCereals',
    grams: 40,
    kcal: 150,
    proteinG: 4,
    carbsG: 30,
    fatG: 1,
    sodiumMg: 100,
  };
}
