import { beforeEach, describe, expect, it } from 'vitest';
import type { HealthDailySteps } from '../../src/healthIngest';

/**
 * What every `HealthDailySteps` must do (MM-442): the fake, the adapter
 * over the plugin and the platform that is not there. `create` gives one
 * with whatever steps it holds; the suite assumes none in particular.
 */
export function healthDailyStepsContract(name: string, create: () => Promise<HealthDailySteps>): void {
  describe(`${name} totals a day's steps`, () => {
    let source: HealthDailySteps;
    const from = new Date(2000, 0, 1);
    const to = new Date(2100, 0, 1);

    beforeEach(async () => {
      source = await create();
    });

    it('gives each day once, oldest first, at its local midnight, within the range, with a whole number of steps above zero', async () => {
      const days = await source.dailySteps({ from, to });
      days.forEach((day, i) => {
        expect(day.day.getHours(), 'local midnight').toBe(0);
        expect(day.day.getMinutes()).toBe(0);
        expect(day.day.getTime()).toBeGreaterThanOrEqual(from.getTime());
        expect(day.day.getTime()).toBeLessThan(to.getTime());
        expect(Number.isInteger(day.steps)).toBe(true);
        expect(day.steps).toBeGreaterThan(0);
        const before = days[i - 1];
        if (before !== undefined) expect(day.day.getTime()).toBeGreaterThan(before.day.getTime());
      });
    });

    it('a range of one day gives at most that day, and the same total as the whole range', async () => {
      const days = await source.dailySteps({ from, to });
      for (const day of days.slice(0, 3)) {
        const next = new Date(day.day.getFullYear(), day.day.getMonth(), day.day.getDate() + 1);
        expect(await source.dailySteps({ from: day.day, to: next })).toEqual([day]);
      }
    });

    it('an empty range gives nothing', async () => {
      expect(await source.dailySteps({ from: to, to: from })).toEqual([]);
      expect(await source.dailySteps({ from, to: from })).toEqual([]);
    });
  });
}
