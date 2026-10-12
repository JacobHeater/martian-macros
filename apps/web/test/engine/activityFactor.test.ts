import { describe, expect, it } from 'vitest';
import { DailyActivity } from '../../src/domain';
import { activityFactor, initialTdeePrior } from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/**
 * MM-164: the starting expenditure estimate depends on daily activity as
 * well as training days.
 */
const daily: Record<DailyActivity, number> = { seated: 1.2, light: 1.3, onFeet: 1.4, physicalJob: 1.5 };

describe('activityFactor', () => {
  for (const level of DailyActivity.values) {
    for (const days of upTo(8)) {
      it(`${level} with ${days} training days`, () => {
        expectClose(
          activityFactor({ dailyActivity: level, trainingDaysPerWeek: days }),
          daily[level] + 0.025 * days,
          1e-12,
        );
      });
    }
  }

  it('every activity level is covered by the table above', () => {
    expect(new Set(Object.keys(daily))).toEqual(new Set(DailyActivity.values));
  });

  it('more activity or more training never lowers the factor', () => {
    for (const days of upTo(8)) {
      let previous: number | undefined;
      for (const level of DailyActivity.values) {
        const f = activityFactor({ dailyActivity: level, trainingDaysPerWeek: days });
        if (previous !== undefined) expect(f).toBeGreaterThan(previous);
        previous = f;
      }
    }
  });

  it('training days outside 0 to 7 are held to that range', () => {
    const f = (days: number) => activityFactor({ dailyActivity: 'light', trainingDaysPerWeek: days });
    expect(f(-2)).toBe(f(0));
    expect(f(12)).toBe(f(7));
  });

  it('stays at or just under the common published multipliers', () => {
    const f = (a: DailyActivity, d: number) => activityFactor({ dailyActivity: a, trainingDaysPerWeek: d });
    const between = (value: number, low: number, high: number) => {
      expect(value).toBeGreaterThanOrEqual(low);
      expect(value).toBeLessThanOrEqual(high);
    };
    between(f('seated', 3), 1.2, 1.375);
    expectClose(f('light', 3), 1.375, 1e-12);
    between(f('onFeet', 4), 1.375, 1.55);
    between(f('physicalJob', 6), 1.55, 1.725);
  });
});

describe('initialTdeePrior', () => {
  it('is resting energy times the factor, with 15% uncertainty', () => {
    const prior = initialTdeePrior({ bmrKcal: 1800, dailyActivity: 'light', trainingDaysPerWeek: 3 });
    expectClose(prior.kcal, 1800 * 1.375, 1e-9);
    expectClose(prior.sigmaKcal, 1800 * 1.375 * 0.15, 1e-9);
  });

  it('two otherwise identical people differ by their daily activity', () => {
    const kcal = (a: DailyActivity) => initialTdeePrior({ bmrKcal: 1800, dailyActivity: a, trainingDaysPerWeek: 3 }).kcal;
    // 1.575 / 1.275: the physical job is about 24% higher.
    expectClose(kcal('physicalJob') / kcal('seated'), 1.575 / 1.275, 1e-9);
  });
});
