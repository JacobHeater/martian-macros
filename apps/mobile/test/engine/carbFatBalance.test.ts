import { describe, expect, it } from 'vitest';
import { CarbFatBalance } from '../../src/domain/CarbFatBalance';
import { SafetyBounds } from '../../src/engine/SafetyBounds';
import { splitCarbsAndFat } from '../../src/engine/splitCarbsAndFat';

/** MM-122: the balance of carbohydrate and fat after protein, never under the fat minimum. */
describe('splitCarbsAndFat', () => {
  const man80 = (kcal: number) => SafetyBounds.minFatG({ sex: 'male', weightKg: 80, heightCm: 180, kcal });
  const woman60 = (kcal: number) => SafetyBounds.minFatG({ sex: 'female', weightKg: 60, heightCm: 165, kcal });
  const moreCarbs = new CarbFatBalance({ fatShare: CarbFatBalance.moreCarbsFatShare });
  const moreFat = new CarbFatBalance({ fatShare: CarbFatBalance.moreFatFatShare });

  it('Balanced is fat at 30% of calories: 2,400 kcal and 160 g of protein give 80 g of fat and 260 g of carbs', () => {
    const { fatG, carbsG } = splitCarbsAndFat({ kcal: 2400, proteinG: 160, fatMinimumG: man80(2400), balance: CarbFatBalance.balanced });
    expect(fatG).toBeCloseTo(80, 6);
    expect(carbsG).toBeCloseTo(260, 6);
  });

  it('More carbs stops at the fat minimum: 53 g (20% of calories, above 0.5 g per kg) for an 80 kg man on 2,400 kcal', () => {
    const { fatG, carbsG } = splitCarbsAndFat({ kcal: 2400, proteinG: 160, fatMinimumG: man80(2400), balance: moreCarbs });
    expect(fatG).toBeCloseTo(480 / 9, 6);
    expect(fatG).toBeGreaterThan(0.5 * 80);
    expect(carbsG).toBeCloseTo((2400 - 640 - 480) / 4, 6);
  });

  it('on low calories More fat keeps carbs at 100 g and fat takes what remains above its own minimum', () => {
    const minimum = woman60(1300);
    const { fatG, carbsG } = splitCarbsAndFat({ kcal: 1300, proteinG: 115, fatMinimumG: minimum, balance: moreFat });
    expect(carbsG).toBeCloseTo(100, 6);
    expect(fatG).toBeCloseTo((1300 - 460 - 400) / 9, 6);
    expect(fatG).toBeGreaterThanOrEqual(minimum);
    expect(fatG).toBeLessThan((0.4 * 1300) / 9);
  });

  it('with the carb floor off, More fat is 40% of calories even when carbs fall under 100 g', () => {
    const { fatG, carbsG } = splitCarbsAndFat({
      kcal: 1300,
      proteinG: 115,
      fatMinimumG: woman60(1300),
      balance: new CarbFatBalance({ fatShare: CarbFatBalance.moreFatFatShare, carbFloorOff: true }),
    });
    expect(fatG).toBeCloseTo((0.4 * 1300) / 9, 6);
    expect(carbsG).toBeLessThan(100);
  });

  it('is a proportion: 35% fat stays 35% of the new calories after they fall 100 kcal', () => {
    const balance = new CarbFatBalance({ fatShare: 0.35 });
    for (const kcal of [2400, 2300]) {
      expect(splitCarbsAndFat({ kcal, proteinG: 160, fatMinimumG: man80(kcal), balance }).fatG).toBeCloseTo((0.35 * kcal) / 9, 6);
    }
  });

  it('unless the minimum requires more', () => {
    // A 110 kg man of 180 cm: 0.5 g per kg of reference weight is above 20% of 1,600 kcal.
    const minimum = SafetyBounds.minFatG({ sex: 'male', weightKg: 110, heightCm: 180, kcal: 1600 });
    expect(minimum).toBeGreaterThan((0.2 * 1600) / 9);
    expect(splitCarbsAndFat({ kcal: 1600, proteinG: 180, fatMinimumG: minimum, balance: moreCarbs }).fatG).toBeCloseTo(minimum, 6);
  });

  it('when protein, the fat minimum and the carb floor do not all fit, the carb floor gives way first', () => {
    const minimum = woman60(1200);
    const { fatG, carbsG } = splitCarbsAndFat({ kcal: 1200, proteinG: 180, fatMinimumG: minimum, balance: moreFat });
    expect(fatG).toBeCloseTo(minimum, 6);
    expect(carbsG).toBeCloseTo((1200 - 720 - 9 * minimum) / 4, 6);
    expect(carbsG).toBeLessThan(100);
  });

  it('never changes protein or calories: every position fills the same calories after the same protein', () => {
    for (const fatShare of [0.2, 0.25, 0.3, 0.35, 0.4]) {
      for (const carbFloorOff of [false, true]) {
        const { fatG, carbsG } = splitCarbsAndFat({
          kcal: 2400,
          proteinG: 160,
          fatMinimumG: man80(2400),
          balance: new CarbFatBalance({ fatShare, carbFloorOff }),
        });
        expect(4 * 160 + 9 * fatG + 4 * carbsG).toBeCloseTo(2400, 6);
      }
    }
  });

  it('without a choice it is MM-24’s split: fat the larger of its minimum and 25% of calories', () => {
    const { fatG, carbsG } = splitCarbsAndFat({ kcal: 2400, proteinG: 160, fatMinimumG: man80(2400) });
    expect(fatG).toBeCloseTo((0.25 * 2400) / 9, 6);
    expect(carbsG).toBeCloseTo((2400 - 640 - 600) / 4, 6);
  });

  it('holds a chosen share between More carbs and More fat', () => {
    expect(new CarbFatBalance({ fatShare: 0.1 }).fatShare).toBe(CarbFatBalance.moreCarbsFatShare);
    expect(new CarbFatBalance({ fatShare: 0.6 }).fatShare).toBe(CarbFatBalance.moreFatFatShare);
  });
});
