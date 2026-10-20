import { describe, expect, it } from 'vitest';
import { CookingFat, CookingFatKind } from '../../src/domain';
import { expectClose } from '../support/expectClose';

/** MM-152: a spoonful of the fat a food was cooked in, by the fat the person usually uses. */
describe('CookingFat', () => {
  it('a teaspoon of oil is about 40 kcal and a tablespoon about 120, all fat', () => {
    const tsp = CookingFat.totals('teaspoon', 'oil');
    const tbsp = CookingFat.totals('tablespoon', 'oil');
    expectClose(tsp?.kcal ?? 0, 40, 1);
    expect(tsp?.fatG).toBe(4.5);
    expect(tsp?.proteinG).toBe(0);
    expectClose(tbsp?.kcal ?? 0, 120, 1);
    expect(tbsp?.fatG).toBe(13.5);
  });

  it('butter is lighter per spoon than oil, as the label says', () => {
    const tsp = CookingFat.totals('teaspoon', 'butter');
    expectClose(tsp?.kcal ?? 0, 33.7, 0.1);
    expectClose(tsp?.fatG ?? 0, 3.81, 0.01);
    expect(CookingFat.grams('tablespoon', 'butter')).toBe(14.2);
  });

  it('none adds nothing', () => {
    expect(CookingFat.totals('none', 'oil')).toBeUndefined();
    expect(CookingFat.grams('none', 'ghee')).toBe(0);
    expect(CookingFat.unit('none')).toBeUndefined();
    expect(CookingFat.unit('teaspoon')).toBe('teaspoon');
  });

  it('every kind states more than 700 kcal per 100 g and is nearly all fat', () => {
    for (const kind of CookingFatKind.values) {
      const per100g = CookingFatKind.per100g(kind);
      expect(per100g.kcal, kind).toBeGreaterThan(700);
      expect(per100g.fatG, kind).toBeGreaterThan(80);
      expect(CookingFatKind.teaspoonG(kind), kind).toBeLessThan(CookingFatKind.tablespoonG(kind));
    }
  });
});
