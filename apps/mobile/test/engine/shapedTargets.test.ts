import { describe, expect, it } from 'vitest';
import { CarbFatBalance } from '../../src/domain/CarbFatBalance';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { TargetShape } from '../../src/domain/TargetShape';
import { WeekShape } from '../../src/domain/WeekShape';
import { DailyTargets } from '../../src/engine/DailyTargets';
import { shapedTargets } from '../../src/engine/shapedTargets';
import { TargetShapeLimits } from '../../src/engine/TargetShapeLimits';

/** MM-122, MM-124: a day's targets with the user's shape applied. */
describe('shapedTargets', () => {
  const since = CalendarDate.of(2026, 10, 5);
  const flat = new DailyTargets({ kcal: 2000, proteinG: 160, proteinMinimumG: 130, fatG: 600 / 9, carbsG: (2000 - 640 - 600) / 4, weeklyRateFraction: -0.005 });
  const limits = new TargetShapeLimits({ floorKcal: 1500, sex: 'male', trendWeightKg: 80, heightCm: 180 });
  const weekend = new WeekShape({ higherDays: [6, 0], raise: 0.2 });
  const day = (weekday: number, shape: TargetShape | undefined, targets = flat) => shapedTargets({ targets, weekday, shape, limits });

  it('leaves the targets as issued with no shape, or a flat week and no balance', () => {
    expect(day(1, undefined)).toBe(flat);
    expect(day(1, new TargetShape({ since }))).toBe(flat);
  });

  it('Balanced chosen: fat 30% of calories, carbs the rest, calories and protein as issued', () => {
    const issued = new DailyTargets({ kcal: 2000, proteinG: 160, proteinMinimumG: 130, fatG: 500 / 9, carbsG: (2000 - 640 - 500) / 4, weeklyRateFraction: -0.005 });
    const shaped = day(1, new TargetShape({ since, balance: CarbFatBalance.balanced }), issued);
    expect(shaped.kcal).toBe(2000);
    expect(shaped.proteinG).toBe(160);
    expect(shaped.fatG).toBeCloseTo(600 / 9, 6);
    expect(shaped.carbsG).toBeCloseTo((2000 - 640 - 600) / 4, 6);
  });

  it('gives each day its share of the week, and the seven days total the flat week', () => {
    const shape = new TargetShape({ since, week: weekend });
    const days = [0, 1, 2, 3, 4, 5, 6].map((weekday) => day(weekday, shape));
    expect(days[6]?.kcal).toBeCloseTo(2400, 6);
    expect(days[1]?.kcal).toBeCloseTo(1840, 6);
    expect(days.reduce((sum, d) => sum + d.kcal, 0)).toBeCloseTo(14000, 6);
  });

  it('keeps protein and its minimum the same on every day of the week', () => {
    const shape = new TargetShape({ since, balance: CarbFatBalance.balanced, week: new WeekShape({ higherDays: [1, 3, 5], raise: 0.3 }) });
    for (let weekday = 0; weekday < 7; weekday++) {
      const shaped = day(weekday, shape);
      expect(shaped.proteinG).toBe(160);
      expect(shaped.proteinMinimumG).toBe(130);
    }
  });

  it('carries the difference with carbs first: a higher day has the flat day’s fat and more carbs', () => {
    const shape = new TargetShape({ since, week: weekend });
    const higher = day(6, shape);
    expect(higher.fatG).toBeCloseTo(flat.fatG, 6);
    expect(higher.carbsG).toBeCloseTo(flat.carbsG + 400 / 4, 6);
    const lower = day(2, shape);
    expect(lower.fatG).toBeCloseTo(flat.fatG, 6);
    expect(lower.carbsG).toBeCloseTo(flat.carbsG - 160 / 4, 6);
  });

  it('on a lower day takes fat down only once carbs reach their floor, and never under the fat minimum', () => {
    const lean = new DailyTargets({ kcal: 1800, proteinG: 200, fatG: 720 / 9, carbsG: (1800 - 800 - 720) / 4, weeklyRateFraction: -0.005 });
    const shape = new TargetShape({ since, balance: new CarbFatBalance({ fatShare: 0.4 }), week: new WeekShape({ higherDays: [6, 0], raise: 0.3 }) });
    const lower = day(2, shape, lean);
    expect(lower.carbsG).toBeGreaterThanOrEqual(100 - 1e-9);
    expect(lower.fatG).toBeGreaterThanOrEqual(limits.fatMinimumG(lower.kcal) - 1e-9);
    expect(4 * lower.proteinG + 9 * lower.fatG + 4 * lower.carbsG).toBeCloseTo(lower.kcal, 6);
  });

  it('splits a day by the balance chosen', () => {
    const shaped = day(1, new TargetShape({ since, balance: new CarbFatBalance({ fatShare: 0.4 }) }));
    expect(shaped.kcal).toBe(2000);
    expect(shaped.fatG).toBeCloseTo(800 / 9, 6);
    expect(shaped.carbsG).toBeCloseTo((2000 - 640 - 800) / 4, 6);
  });
});
