import { describe, expect, it } from 'vitest';
import type { FoodGroup } from '../../src/domain/food/FoodGroup';
import type { TradeCatalog } from '../../src/engine/analysis/TradeCatalog';

/** A catalog food for the contract, at its default serving of `grams`. */
export interface TradeCatalogSeed {
  readonly packId: string;
  readonly foodId: number;
  readonly name: string;
  readonly group: FoodGroup | undefined;
  readonly grams: number;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly sodiumMg: number | undefined;
}

/** The pack every seed is in: an implementation over packs writes one of this id. */
export const tradeCatalogPackId = 'trade';

const seed = (foodId: number, name: string, group: FoodGroup | undefined, kcal: number, grams = 100): TradeCatalogSeed => ({
  packId: tradeCatalogPackId,
  foodId,
  name,
  group,
  grams,
  kcal,
  proteinG: kcal / 20,
  carbsG: kcal / 8,
  fatG: kcal / 40,
  sodiumMg: kcal,
});

const seeds: readonly TradeCatalogSeed[] = [
  seed(1, 'Granola, honey', 'breakfastCereals', 420, 90),
  seed(2, 'Bran flakes', 'breakfastCereals', 250),
  seed(3, 'Muesli', 'breakfastCereals', 380, 100),
  seed(4, 'Puffed rice', 'breakfastCereals', 120, 30),
  seed(5, 'Tuna, canned', 'fish', 200, 140),
  seed(6, 'Granola of no kind', undefined, 300, 80),
];

/**
 * What every `TradeCatalog` must do (MM-607): the group of the foods the
 * entries were logged from, and a group's foods within a band of calories,
 * at their default serving. `create` is given the seeds, and entries logged
 * from each of them.
 */
export function tradeCatalogContract(
  name: string,
  create: (seeds: readonly TradeCatalogSeed[]) => TradeCatalog | Promise<TradeCatalog>,
): void {
  describe(`${name} as a TradeCatalog`, () => {
    it("knows a logged catalog food's group by its pack and id", async () => {
      const catalog = await create(seeds);
      expect(catalog.groupOf({ packId: tradeCatalogPackId, foodId: 1 })).toBe('breakfastCereals');
      expect(catalog.groupOf({ packId: tradeCatalogPackId, foodId: 5 })).toBe('fish');
    });

    it('a food with no group, an unknown food and a saved food have no group', async () => {
      const catalog = await create(seeds);
      expect(catalog.groupOf({ packId: tradeCatalogPackId, foodId: 6 })).toBeUndefined();
      expect(catalog.groupOf({ packId: tradeCatalogPackId, foodId: 99 })).toBeUndefined();
      expect(catalog.groupOf({ packId: 'custom', foodId: 1 })).toBeUndefined();
    });

    it("lists only the group's foods within the band, its ends included", async () => {
      const catalog = await create(seeds);
      const names = catalog
        .candidatesIn('breakfastCereals', { minKcal: 250, maxKcal: 380 })
        .map((f) => f.name)
        .sort();
      expect(names).toEqual(['Bran flakes', 'Muesli']);
      expect(catalog.candidatesIn('breakfastCereals', { minKcal: 260, maxKcal: 400 }).map((f) => f.name)).toEqual(['Muesli']);
      expect(catalog.candidatesIn('fish', { minKcal: 250, maxKcal: 420 })).toEqual([]);
      expect(catalog.candidatesIn('fruit', { minKcal: 0, maxKcal: undefined })).toEqual([]);
    });

    it('with no ceiling, lists every food of the group from the floor up', async () => {
      const catalog = await create(seeds);
      const names = catalog
        .candidatesIn('breakfastCereals', { minKcal: 200, maxKcal: undefined })
        .map((f) => f.name)
        .sort();
      expect(names).toEqual(['Bran flakes', 'Granola, honey', 'Muesli']);
    });

    it('never lists a food without a group', async () => {
      const catalog = await create(seeds);
      for (const group of ['breakfastCereals', 'fish'] as const) {
        const listed = catalog.candidatesIn(group, { minKcal: 0, maxKcal: undefined });
        expect(listed.every((f) => f.group === group && f.kcal > 0)).toBe(true);
        expect(listed.map((f) => f.name)).not.toContain('Granola of no kind');
      }
    });

    it('states each food at its default serving', async () => {
      const catalog = await create(seeds);
      const [granola] = catalog.candidatesIn('breakfastCereals', { minKcal: 400, maxKcal: 440 });
      expect(granola?.name).toBe('Granola, honey');
      expect(granola?.grams).toBeCloseTo(90);
      expect(granola?.kcal).toBeCloseTo(420);
      expect(granola?.proteinG).toBeCloseTo(21);
      expect(granola?.carbsG).toBeCloseTo(52.5);
      expect(granola?.fatG).toBeCloseTo(10.5);
      expect(granola?.sodiumMg).toBeCloseTo(420);
    });
  });
}
