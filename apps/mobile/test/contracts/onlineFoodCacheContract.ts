import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import type { OnlineFoodCache } from '../../src/foodCatalog/online/OnlineFoodCache';
import { onlinePackId } from '../../src/foodCatalog/online/onlinePackId';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';

const entry = (over: { name?: string; gtin?: string; sourceId?: string; kcal?: number } = {}): PackEntry => ({
  food: new CatalogFood({
    id: 0,
    packId: 'anything',
    name: over.name ?? 'Thai peanut noodle kit',
    brand: 'Thai Kitchen',
    kcal: over.kcal ?? 385,
    proteinG: 9.6,
    carbsG: 71.2,
    fatG: 7.7,
    fiberG: 1.9,
    sodiumMg: 288,
    micros: { sugars: 13.5, saturatedFat: 1.9 },
    source: 'off',
    sourceId: over.sourceId ?? '0737628064502',
    tier: 'checkThis',
    tierReason: 'Entered by Open Food Facts contributors and not checked against a package.',
  }),
  servings: [{ description: '1/3 package', grams: 52 }],
  barcodes: over.gtin === undefined ? ['00737628064502'] : over.gtin === '' ? [] : [over.gtin],
});

/** What every `OnlineFoodCache` must do (MM-58). */
export function onlineFoodCacheContract(name: string, create: () => OnlineFoodCache | Promise<OnlineFoodCache>): void {
  describe(`${name} as an OnlineFoodCache`, () => {
    let cache: OnlineFoodCache;
    beforeEach(async () => {
      cache = await create();
    });

    it('starts empty and answers as the online pack', async () => {
      expect(cache.packId).toBe(onlinePackId);
      expect(await cache.count()).toBe(0);
      expect(await cache.byBarcode('00737628064502')).toBeUndefined();
      expect(await cache.search('noodle')).toEqual([]);
    });

    it('keeps a food with every figure, its servings and its barcode, as the online pack', async () => {
      const kept = await cache.remember(entry());
      expect(kept.packId).toBe(onlinePackId);
      expect(kept.id).toBeGreaterThan(0);
      const found = await cache.byBarcode('00737628064502');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Thai peanut noodle kit');
      expect(found?.brand).toBe('Thai Kitchen');
      expect(found?.kcal).toBe(385);
      expect(found?.fiberG).toBe(1.9);
      expect(found?.sodiumMg).toBe(288);
      expect(found?.micros).toEqual({ sugars: 13.5, saturatedFat: 1.9 });
      expect(found?.source).toBe('off');
      expect(found?.sourceId).toBe('0737628064502');
      expect(found?.tier).toBe('checkThis');
      expect(found?.tierReason).toMatch(/Open Food Facts/);
      expect(await cache.servingsOf(kept)).toEqual([{ description: '1/3 package', grams: 52 }]);
      expect(await cache.pairOf(kept)).toBeUndefined();
    });

    it('a newer answer for the same barcode replaces the older, and so does the same source record', async () => {
      await cache.remember(entry({ kcal: 385 }));
      await cache.remember(entry({ kcal: 390 }));
      expect(await cache.count()).toBe(1);
      expect((await cache.byBarcode('00737628064502'))?.kcal).toBe(390);
      await cache.remember(entry({ gtin: '', sourceId: 'x1', name: 'Oat milk' }));
      await cache.remember(entry({ gtin: '', sourceId: 'x1', name: 'Oat milk, barista' }));
      expect(await cache.count()).toBe(2);
      expect((await cache.search('oat')).map((h) => h.food.name)).toEqual(['Oat milk, barista']);
    });

    it('searches the name and brand by every word, a word at the start of the name first', async () => {
      await cache.remember(entry({ gtin: '', sourceId: 'a', name: 'Peanut butter' }));
      await cache.remember(entry({ gtin: '', sourceId: 'b', name: 'Thai peanut noodle kit' }));
      const hits = await cache.search('peanut');
      expect(hits.map((h) => h.food.name)).toEqual(['Peanut butter', 'Thai peanut noodle kit']);
      expect((await cache.search('kitchen peanut')).map((h) => h.food.name)).toEqual(['Peanut butter', 'Thai peanut noodle kit']);
      expect(await cache.search('   ')).toEqual([]);
      expect((await cache.search('peanut', { limit: 1 })).length).toBe(1);
    });

    it('servings are asked only of its own foods', async () => {
      const other = new CatalogFood({ ...entry().food, id: 1, packId: 'barcode_us', brand: undefined });
      expect(await cache.servingsOf(other)).toEqual([]);
    });

    it('forgets everything when cleared', async () => {
      await cache.remember(entry());
      await cache.clear();
      expect(await cache.count()).toBe(0);
    });
  });
}
