import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { cycleNoiseMultiplier, CycleRule, cycleWindows, WeightTrendModel } from '../../src/engine';
import { upTo } from '../support/upTo';

/** MM-20: marked flow days widen the trend's noise from five days before each start through two after. */
const day = (n: number) => CalendarDate.of(2026, 3, n);

it('five consecutive flow days make one window, from five days before the first through two after it', () => {
  const windows = cycleWindows([10, 11, 12, 13, 14].map((n) => ({ date: day(n) })));
  expect(windows).toEqual([{ from: day(5), to: day(12) }]);
  expect(CycleRule.daysBefore).toBe(5);
  expect(CycleRule.daysAfter).toBe(2);
});

it('two periods make two windows, oldest first, whatever order the days come in', () => {
  const later = day(10).addDays(29);
  const windows = cycleWindows([later.addDays(1), day(10), day(11), later].map((date) => ({ date })));
  expect(windows.map((w) => w.from)).toEqual([day(5), later.addDays(-5)]);
});

it('the noise multiplier is the window, and nothing outside it', () => {
  const multiplier = cycleNoiseMultiplier([{ date: day(10) }]);
  expect(multiplier(day(4))).toBe(1);
  expect(multiplier(day(5))).toBe(CycleRule.multiplier);
  expect(multiplier(day(12))).toBe(CycleRule.multiplier);
  expect(multiplier(day(13))).toBe(1);
});

it('a premenstrual spike moves the trend less than the same jump mid-cycle', () => {
  const model = new WeightTrendModel();
  const base = upTo(40).map((i) => ({ date: day(1).addDays(i), weightKg: 62 }));
  // A 1.2 kg jump on three readings, three days before a marked period starting on March 31.
  const start = day(31);
  const spiked = base.map((w) => (w.date.daysUntil(start) <= 3 && w.date.daysUntil(start) >= 1 ? { ...w, weightKg: 63.2 } : w));
  const flow = upTo(4).map((i) => ({ date: start.addDays(i) }));
  const through = start.addDays(2);
  const withCycle = model.smooth(spiked, { through, noiseMultiplier: cycleNoiseMultiplier(flow) });
  const without = model.smooth(spiked, { through });
  const at = (points: readonly { date: CalendarDate; levelKg: number }[], d: CalendarDate) => points.find((p) => p.date === d)?.levelKg ?? 0;
  expect(at(withCycle, day(30))).toBeLessThan(at(without, day(30)));
  expect(at(withCycle, day(30))).toBeGreaterThan(62);
});
