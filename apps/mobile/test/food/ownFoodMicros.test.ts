import { expect, it } from 'vitest';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { customCatalogFood } from '../../src/food/custom/customCatalogFood';
import { microsOfPackFood } from '../../src/food/microsOfPackFood';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';

/** MM-308, MM-309: what a food states per 100 g or per serving is scaled to the amount eaten. */

it('a food of my own with 160 mg sodium and 260 mg calcium a serving gives twice that for two servings', () => {
  const own = customCatalogFood(
    new CustomFood({
      id: 1,
      name: 'Oat milk',
      kind: 'food',
      servingDescription: '1 cup',
      servingGrams: 240,
      perServing: new NutritionTotals({ kcal: 120, proteinG: 3, carbsG: 16, fatG: 5 }),
      fiberG: 2,
      micros: new Micronutrients({ sodium: 160, calcium: 260 }),
    }),
  );
  const eaten = microsOfPackFood(own).times(480 / 100);
  expect(eaten.of('sodium')).toBeCloseTo(320, 6);
  expect(eaten.of('calcium')).toBeCloseTo(520, 6);
  expect(eaten.of('iron')).toBeUndefined();
  expect((own.fiberG ?? 0) * 4.8).toBeCloseTo(4, 6);
});

it('a pack food with 358 mg potassium per 100 g gives 537 mg for 150 g', () => {
  const banana = new CatalogFood({
    id: 1,
    packId: 'generic',
    name: 'Bananas, raw',
    kcal: 89,
    proteinG: 1.1,
    carbsG: 23,
    fatG: 0.3,
    sodiumMg: 1,
    micros: { potassium: 358 },
    source: 'usda_sr_legacy',
    tier: 'reference',
    tierReason: '',
  });
  const eaten = microsOfPackFood(banana).times(1.5);
  expect(eaten.of('potassium')).toBe(537);
  expect(eaten.of('sodium')).toBe(1.5);
  expect(eaten.of('calcium')).toBeUndefined();
});
