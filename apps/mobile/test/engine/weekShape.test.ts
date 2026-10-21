import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { IntakeDay } from '../../src/domain/IntakeDay';
import { WeekShape } from '../../src/domain/WeekShape';
import { shapeWeek } from '../../src/engine/shapeWeek';
import { usableIntakeDays } from '../../src/engine/usableIntakeDays';

/** MM-124: a week with higher days and the same total. */
describe('shapeWeek', () => {
  const total = (week: WeekShape, { higherKcal, lowerKcal }: { higherKcal: number; lowerKcal: number }) =>
    week.higherDays.size * higherKcal + (7 - week.higherDays.size) * lowerKcal;

  it('two days 20% higher on 2,000 kcal: 2,400 on those, 1,840 on the other five, 14,000 in all', () => {
    const week = new WeekShape({ higherDays: [6, 0], raise: 0.2 });
    const shaped = shapeWeek({ flatKcal: 2000, floorKcal: 1500, week });
    expect(shaped.higherKcal).toBeCloseTo(2400, 6);
    expect(shaped.lowerKcal).toBeCloseTo(1840, 6);
    expect(total(week, shaped)).toBeCloseTo(14000, 6);
    expect(shaped.reducedBy).toBeUndefined();
  });

  it('the floor limits the shape: 1,300 kcal, a floor of 1,200 and two days 30% higher give 1,200 and 1,550, and says so', () => {
    const week = new WeekShape({ higherDays: [5, 6], raise: 0.3 });
    const shaped = shapeWeek({ flatKcal: 1300, floorKcal: 1200, week });
    expect(shaped.lowerKcal).toBeCloseTo(1200, 6);
    expect(shaped.higherKcal).toBeCloseTo(1550, 6);
    expect(total(week, shaped)).toBeCloseTo(7 * 1300, 6);
    expect(shaped.reducedBy).toBe('floor');
  });

  it('no lower day is more than 15% under the flat figure: three days 30% higher on 2,400 kcal', () => {
    const week = new WeekShape({ higherDays: [5, 6, 0], raise: 0.3 });
    const shaped = shapeWeek({ flatKcal: 2400, floorKcal: 1500, week });
    expect(shaped.lowerKcal).toBeGreaterThanOrEqual(2040 - 1e-9);
    expect(shaped.higherKcal).toBeLessThan(2400 * 1.3);
    expect(total(week, shaped)).toBeCloseTo(7 * 2400, 6);
    expect(shaped.reducedBy).toBe('lowering');
  });

  it('a flat figure at the floor leaves nothing to move', () => {
    const shaped = shapeWeek({ flatKcal: 1500, floorKcal: 1500, week: new WeekShape({ higherDays: [6], raise: 0.1 }) });
    expect([shaped.higherKcal, shaped.lowerKcal]).toEqual([1500, 1500]);
    expect(shaped.reducedBy).toBe('floor');
  });

  it('is flat with no higher days, and holds at most three', () => {
    expect(shapeWeek({ flatKcal: 2000, floorKcal: 1500, week: WeekShape.flat })).toEqual({ higherKcal: 2000, lowerKcal: 2000, reducedBy: undefined });
    expect(new WeekShape({ higherDays: [0, 1, 2, 3, 4], raise: 0.2 }).higherDays.size).toBe(WeekShape.maxHigherDays);
    expect(new WeekShape({ higherDays: [6], raise: 0.27 }).raise).toBe(0.3);
  });
});

/**
 * MM-124's note on MM-27: a planned lower day eaten as planned is never taken for a half-logged day. Every
 * shape the app allows, eaten exactly, unmarked, for four weeks: the partial-day rule keeps all 28 days.
 */
describe('a shaped week and the partial-day rule', () => {
  const start = CalendarDate.of(2026, 9, 7);
  const sets = [[0], [6, 0], [5, 6, 0], [1, 3, 5]];
  for (const higherDays of sets) {
    for (const raise of WeekShape.raises) {
      it(`keeps every day of ${higherDays.length} higher day(s) ${Math.round(raise * 100)}% higher`, () => {
        const week = new WeekShape({ higherDays, raise });
        const shaped = shapeWeek({ flatKcal: 2000, floorKcal: 1200, week });
        const days = Array.from({ length: 28 }, (_, i) => {
          const date = start.addDays(i);
          const kcal = week.higherDays.has(date.weekday) ? shaped.higherKcal : shaped.lowerKcal;
          return new IntakeDay({ date, kcal, proteinG: 150, carbsG: (kcal - 600 - 600) / 4, fatG: 600 / 9 });
        });
        expect(usableIntakeDays(days)).toHaveLength(28);
      });
    }
  }
});
