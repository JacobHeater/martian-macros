import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { disagreementReason } from '../../src/foodCatalog/disagreementReason';
import { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { FoodPack } from '../../src/foodCatalog/FoodPack';
import type { SearchHit } from '../../src/foodCatalog/SearchHit';
import { sourceReliability } from '../../src/foodCatalog/sourceReliability';
import { SourceReliabilityRule } from '../../src/foodCatalog/SourceReliabilityRule';
import type { TrustTier } from '../../src/foodCatalog/TrustTier';

/** MM-383: the app's own reliability score orders search and chooses a scanned barcode's record across packs. */
const food = (
  source: string,
  {
    id = 1,
    packId = 'p',
    name = 'Oats',
    tier,
    tierReason = 'test',
    fiber,
    sodium,
    micros = {},
  }: { id?: number; packId?: string; name?: string; tier?: TrustTier; tierReason?: string; fiber?: number; sodium?: number; micros?: Record<string, number> } = {},
) =>
  new CatalogFood({
    id,
    packId,
    name,
    kcal: 100,
    proteinG: 5,
    carbsG: 15,
    fatG: 2,
    fiberG: fiber,
    sodiumMg: sodium,
    micros,
    source,
    tier: tier ?? (source === 'usda_branded' ? 'label' : source === 'off' ? 'checkThis' : 'reference'),
    tierReason,
  });

/** A pack that answers every search with the given hits and every barcode with its one food. */
const pack = (packId: string, hits: SearchHit[]): FoodPack => ({
  packId,
  search: () => Promise.resolve(hits),
  byBarcode: () => Promise.resolve(hits[0]?.food),
  pairOf: () => Promise.resolve(undefined),
  servingsOf: () => Promise.resolve([]),
});

it('scores each source as the rule says, with the modifiers', () => {
  expect(sourceReliability(food('usda_foundation', { fiber: 2, sodium: 5 }))).toBe(98);
  expect(sourceReliability(food('usda_sr_legacy'))).toBe(90);
  expect(sourceReliability(food('usda_fndds', { fiber: 2, sodium: 5, micros: { sugars: 1, saturatedFat: 0.5 } }))).toBe(85);
  expect(sourceReliability(food('usda_branded', { tier: 'checkThis', tierReason: disagreementReason, fiber: 2, sodium: 5, micros: { sugars: 1, saturatedFat: 0.5 } }))).toBe(55);
  expect(sourceReliability(food('off'))).toBe(40);
  expect(sourceReliability(food('off', { tierReason: disagreementReason }))).toBe(25);
  expect(sourceReliability(food('fixture', { tier: 'reference' }))).toBe(85);
  expect(sourceReliability(food('fixture', { tier: 'label' }))).toBe(60);
  expect(sourceReliability(food('fixture', { tier: 'checkThis' }))).toBe(35);
});

it('the order refines the tiers and never crosses them', () => {
  const rule = SourceReliabilityRule;
  const bonuses = rule.fiberAndSodiumBonus + rule.sugarsAndSaturatedFatBonus;
  const lowestReference = Math.min(rule.bases.usda_fndds as number, rule.basesByTier.reference) - 0;
  const highestLabel = Math.max(rule.bases.usda_branded as number, rule.basesByTier.label) + bonuses;
  const highestCheckThis = Math.max((rule.bases.usda_branded as number) - rule.disagreementPenalty, rule.bases.off as number, rule.basesByTier.checkThis) + bonuses;
  expect(lowestReference).toBeGreaterThan(highestLabel);
  expect(highestLabel).toBeGreaterThan(highestCheckThis);
});

it('search lists the more reliable source first, then the better text match', async () => {
  const catalog = new FoodCatalog([
    pack('a', [
      { food: food('off', { id: 1, name: 'Oats' }), score: -5 },
      { food: food('usda_sr_legacy', { id: 2, name: 'Oats, rolled, dry' }), score: -2 },
      { food: food('usda_sr_legacy', { id: 3, name: 'Oats, steel cut' }), score: -1 },
    ]),
    pack('b', [
      { food: food('usda_foundation', { id: 4, name: 'Oats, whole grain' }), score: -1 },
      { food: food('usda_branded', { id: 5, name: 'Oats cereal', tier: 'checkThis', tierReason: disagreementReason }), score: -4 },
    ]),
  ]);
  const hits = await catalog.search('oats');
  expect(hits.map((h) => h.food.id)).toEqual([4, 2, 3, 5, 1]);
});

it('a scanned barcode takes the most reliable record across the packs, the tie going to the first pack', async () => {
  const off = food('off', { id: 1, packId: 'a' });
  const branded = food('usda_branded', { id: 2, packId: 'b' });
  expect((await new FoodCatalog([pack('a', [{ food: off, score: 0 }]), pack('b', [{ food: branded, score: 0 }])]).byBarcode('x'))?.id).toBe(2);
  const twin = food('usda_branded', { id: 3, packId: 'c' });
  expect((await new FoodCatalog([pack('b', [{ food: branded, score: 0 }]), pack('c', [{ food: twin, score: 0 }])]).byBarcode('x'))?.id).toBe(2);
  expect(await new FoodCatalog([pack('a', [])]).byBarcode('x')).toBeUndefined();
});

it('no screen reads the score: it orders, and is never shown beside a food', () => {
  const screens = ['src/food', 'src/foodPacks', 'src/settings', 'src/dashboard', 'src/coach', 'src/about', 'src/format'];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/.test(name)) files.push(path);
    }
  };
  for (const dir of screens) walk(dir);
  const readers = files.filter((file) => /sourceReliability|SourceReliabilityRule/.test(readFileSync(file, 'utf8')));
  expect(readers).toEqual([]);
});
