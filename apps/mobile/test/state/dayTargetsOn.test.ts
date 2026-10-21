import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { TargetShape } from '../../src/domain/TargetShape';
import { WeekShape } from '../../src/domain/WeekShape';
import { DailyTargets } from '../../src/engine/DailyTargets';
import { TargetShapeLimits } from '../../src/engine/TargetShapeLimits';
import { TargetsRecord } from '../../src/engine/TargetsRecord';
import { dayTargetsOn } from '../../src/state/dayTargetsOn';

/** MM-124: a day's target is the plan's, set in advance, whatever was eaten around it. */
describe('dayTargetsOn', () => {
  // 2026-10-05 is a Monday.
  const monday = CalendarDate.of(2026, 10, 5);
  const history = [
    new TargetsRecord({
      effectiveFrom: monday.addDays(-14),
      targets: new DailyTargets({ kcal: 2000, proteinG: 160, fatG: 60, carbsG: 205, weeklyRateFraction: -0.005 }),
      mode: 'fatLoss',
      tdeeKcal: 2500,
      tdeeSigmaKcal: 150,
      tdeeStatus: 'updated',
    }),
  ];
  const limits = new TargetShapeLimits({ floorKcal: 1500, sex: 'male', trendWeightKg: 80, heightCm: 180 });
  const weekend = new TargetShape({ since: monday.addDays(-14), week: new WeekShape({ higherDays: [6, 0], raise: 0.2 }) });
  const on = (day: CalendarDate, shapes: readonly TargetShape[] = [weekend]) => dayTargetsOn({ history, day, shapes, limits })?.kcal;

  it('no taking back: Wednesday’s target is what was planned, however much was eaten on Tuesday', () => {
    // Nothing eaten is an input: the plan alone decides each day.
    expect(on(monday.addDays(2))).toBeCloseTo(1840, 6);
  });

  it('no banking: Tuesday’s target is what was planned after an under-target Monday', () => {
    expect(on(monday.addDays(1))).toBeCloseTo(1840, 6);
  });

  it('a past day keeps the target it had before the shape was changed', () => {
    const changed = new TargetShape({ since: monday, week: WeekShape.flat });
    const lastSaturday = monday.addDays(-2);
    expect(on(lastSaturday, [weekend, changed])).toBeCloseTo(2400, 6);
    expect(on(monday.addDays(5), [weekend, changed])).toBe(2000);
  });

  it('is the targets as issued while the limits are not known', () => {
    expect(dayTargetsOn({ history, day: monday.addDays(5), shapes: [weekend], limits: undefined })?.kcal).toBe(2000);
  });

  it('is nothing where targets are not allowed', () => {
    expect(dayTargetsOn({ history, day: monday, shapes: [weekend], limits, targetsAllowed: false })).toBeUndefined();
  });
});
