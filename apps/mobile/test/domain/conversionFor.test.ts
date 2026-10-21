import { describe, expect, it } from 'vitest';
import { conversionFor, gramsFor, NutritionTotals, PortionUnit, type ReferenceNutrition } from '../../src/domain';
import { HandModel } from '../../src/domain/food/hand/HandModel';
import { expectClose } from '../support/expectClose';

/**
 * MM-167: the conversion an entry records beside its amount is the one
 * `gramsFor` used, so the stored record and the stored grams never disagree.
 */
const per100g: ReferenceNutrition = {
  basis: 'per100g',
  nutrition: new NutritionTotals({ kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }),
};
const hand = { heightCm: 180, sex: 'male' } as const;

describe('conversionFor', () => {
  it('a weight is exact and records no conversion', () => {
    expect(conversionFor('gram', per100g)).toBeUndefined();
    expect(conversionFor('ounce', per100g)).toBeUndefined();
  });

  it("a serving converts through the source's gram weight", () => {
    const cup = { ...per100g, servingDescription: '1 cup', servingGrams: 158, servingUnit: 'serving' as const };
    expect(conversionFor('serving', cup)).toEqual({ kind: 'servingWeight', gramsPerUnit: 158 });
    expect(conversionFor('serving', per100g), 'no gram weight, no conversion').toBeUndefined();
  });

  it('a volume converts through the density, or a serving stated in both volume and weight', () => {
    const dense = { ...per100g, densityGPerMl: 0.9 };
    expect(conversionFor('cup', dense)).toEqual({ kind: 'density', gramsPerUnit: PortionUnit.mlPerCup * 0.9 });
    const stated = { ...per100g, servingGrams: 240, servingMilliliters: 250 };
    const byServing = conversionFor('tablespoon', stated);
    expect(byServing?.kind).toBe('servingWeight');
    expectClose(byServing?.gramsPerUnit ?? 0, (PortionUnit.mlPerTablespoon / 250) * 240, 1e-9);
    expect(conversionFor('cup', per100g), 'nothing to convert a cup with').toBeUndefined();
  });

  it('a hand portion converts through the hand model, and only with a hand', () => {
    const palm = conversionFor('palm', per100g, { hand });
    expect(palm?.kind).toBe('handModel');
    expect(palm?.gramsPerUnit).toBe(HandModel.gramsOf('palm', hand, { per100g: per100g.nutrition }));
    expect(conversionFor('palm', per100g)).toBeUndefined();
  });

  it('agrees with gramsFor for every unit it converts', () => {
    const reference: ReferenceNutrition = { ...per100g, servingGrams: 158, servingMilliliters: 200, servingUnit: 'serving', densityGPerMl: 0.79 };
    for (const unit of PortionUnit.values) {
      const conversion = conversionFor(unit, reference, { hand });
      const grams = gramsFor(2.5, unit, reference, { hand });
      if (conversion === undefined) {
        expect(PortionUnit.isWeight(unit) || grams === undefined, unit).toBe(true);
      } else {
        expectClose(grams ?? Number.NaN, 2.5 * conversion.gramsPerUnit, 1e-9);
      }
    }
  });
});
