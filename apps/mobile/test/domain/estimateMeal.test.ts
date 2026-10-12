import { expect, it } from 'vitest';
import { estimateMeal, MealKind, mealKcal } from '../../src/domain';
import { expectClose } from '../support/expectClose';

/** MM-150: rough meal estimates scaled to the user's maintenance. */
it('sizes scale a third of maintenance, rounded to 50 kcal', () => {
  expect(mealKcal('regular', 2700)).toBe(900);
  expect(mealKcal('light', 2700)).toBe(550);
  expect(mealKcal('large', 2700)).toBe(1350);
  expect(mealKcal('veryLarge', 2700)).toBe(2000);
});

it('a regular balanced meal is about 900 kcal with a balanced split', () => {
  const t = estimateMeal('regular', 'balanced', { maintenanceKcal: 2700 });
  expect(t.kcal).toBe(900);
  expectClose(t.proteinG, 45, 1e-9);
  expectClose(t.carbsG, 112.5, 1e-9);
  expectClose(t.fatG, 30, 1e-9);
});

it('every kind adds to the meal energy', () => {
  for (const kind of MealKind.values) {
    const split = MealKind.split(kind);
    expectClose(split.protein + split.carbs + split.fat, 1, 1e-12);
    const t = estimateMeal('large', kind, { maintenanceKcal: 2400 });
    expectClose(4 * t.proteinG + 4 * t.carbsG + 9 * t.fatG, t.kcal, 1e-9);
  }
});
