import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import type { TrendDay, TrendPoint } from '../../src/engine';
import { detectDrift } from '../../src/engine/trends/detectDrift';
import { detectLevelAgainstTarget } from '../../src/engine/trends/detectLevelAgainstTarget';
import { detectLongRun } from '../../src/engine/trends/detectLongRun';
import { detectRecentAgainstBaseline } from '../../src/engine/trends/detectRecentAgainstBaseline';
import { detectShift } from '../../src/engine/trends/detectShift';
import { detectShortRun } from '../../src/engine/trends/detectShortRun';
import { detectUnloggedWeekday } from '../../src/engine/trends/detectUnloggedWeekday';
import { detectWeekday } from '../../src/engine/trends/detectWeekday';
import { detectWeekend } from '../../src/engine/trends/detectWeekend';
import { weekBlocksOf } from '../../src/engine/trends/weekBlocksOf';
import { trendDays } from './support/trendDays';

/** MM-605: each detector on its own, with the ticket's parameters. */
const start = CalendarDate.of(2026, 9, 7);
const pattern = [-1, -0.5, 0, 0.5, 1];
/** A steady value with a small regular wobble: the median absolute deviation of a whole cycle is half its amplitude. */
const steady = (center: number, count: number, amplitude = 10, from = 0) =>
  Array.from({ length: count }, (_, i) => center + amplitude * (pattern[(from + i) % 5] as number));
const eligible = (days: readonly TrendDay[]) => days.filter((d): d is TrendPoint => d.eligible);
const up = <T extends { direction: string }>(found: readonly T[] | undefined) => found?.find((d) => d.direction === 'up');
const down = <T extends { direction: string }>(found: readonly T[] | undefined) => found?.find((d) => d.direction === 'down');

describe('D1, level against target', () => {
  const withTarget = (values: readonly number[], target = 100) => eligible(trendDays(start, values, () => ({ target })));

  it('fires when the days over target reach k_crit(n) and the median is at least δ over', () => {
    // n 10, k_crit 9: nine days 20 over, one 10 under.
    const found = detectLevelAgainstTarget(withTarget([...Array(9).fill(120), 90]), 10);
    expect(up(found)).toMatchObject({ fires: true, n: 10, k: 9, effect: 20, strong: false });
    expect(down(found)?.fires).toBe(false);
  });

  it('does not fire under k_crit(n)', () => {
    expect(up(detectLevelAgainstTarget(withTarget([...Array(8).fill(120), 90, 90]), 10))?.fires).toBe(false);
  });

  it('does not fire when the median is under δ, however many days agree', () => {
    expect(up(detectLevelAgainstTarget(withTarget(Array(10).fill(105)), 10))?.fires).toBe(false);
  });

  it('leaves days exactly on target out of n', () => {
    const found = up(detectLevelAgainstTarget(withTarget([100, 100, 100, ...Array(7).fill(120)]), 10));
    expect(found).toMatchObject({ fires: true, n: 7, k: 7 });
  });

  it('does not run under 7 days', () => {
    expect(detectLevelAgainstTarget(withTarget(Array(6).fill(150)), 10)).toBeUndefined();
  });
});

describe('D2, drift', () => {
  const line = (count: number) => eligible(trendDays(start, Array.from({ length: count }, (_, i) => 1000 + 10 * i)));

  it('fires on a steady rise whose slope over the regime is at least δ', () => {
    const found = up(detectDrift(line(28), start, start.addDays(27), 100));
    expect(found).toMatchObject({ fires: true, strong: true, effect: 280 });
  });

  it('needs a regime of 21 days', () => {
    expect(detectDrift(line(20), start, start.addDays(19), 100)).toBeUndefined();
  });

  it('needs 3 eligible days in each third of the regime', () => {
    expect(detectDrift(line(18), start, start.addDays(27), 100)).toBeUndefined();
  });

  it('does not fire when the slope over the regime is under δ', () => {
    expect(up(detectDrift(line(28), start, start.addDays(27), 300))?.fires).toBe(false);
  });
});

describe('D3, a shift', () => {
  it('finds the step, dated, with the difference in means', () => {
    const points = eligible(trendDays(start, [...steady(1000, 20), ...steady(1100, 10)]));
    const found = up(detectShift(points, 1, 50));
    expect(found).toMatchObject({ fires: true, strong: true, effect: 100, k: 10, onset: start.addDays(20) });
  });

  it('does not fire on a steady series', () => {
    const found = detectShift(eligible(trendDays(start, steady(1000, 30))), 1, 50);
    expect(found?.some((d) => d.fires)).toBe(false);
  });

  it('recurses once and keeps the most recent change', () => {
    const points = eligible(trendDays(start, [...steady(1000, 20), ...steady(1300, 14), ...steady(1600, 12)]));
    const found = up(detectShift(points, 1, 50));
    expect(found).toMatchObject({ fires: true, onset: start.addDays(34) });
  });

  it('does not run under 7 days before and 5 after', () => {
    expect(detectShift(eligible(trendDays(start, steady(1000, 11))), 1, 50)).toBeUndefined();
  });
});

describe('D4a, a long run against the target', () => {
  const days = (values: readonly (number | undefined)[]) => trendDays(start, values, () => ({ target: 2000 }));

  it('fires on 7 or more days each at least δ over target, ending yesterday', () => {
    const found = up(detectLongRun(days([...Array(6).fill(2000), ...Array(8).fill(2150)]), 100));
    expect(found).toMatchObject({ fires: true, strong: true, n: 8, effect: 150, onset: start.addDays(6) });
  });

  it('lets one ineligible day sit inside the run, and a second ends it', () => {
    const one = [...Array(6).fill(2000), ...Array(8).fill(2150)];
    one[10] = undefined;
    expect(up(detectLongRun(days(one), 100))).toMatchObject({ fires: true, n: 7 });
    const two = [...one];
    two[12] = undefined;
    expect(up(detectLongRun(days(two), 100))?.fires).toBe(false);
  });

  it('counts a run that ended the day before, and not one that ended earlier', () => {
    expect(up(detectLongRun(days([...Array(6).fill(2000), ...Array(7).fill(2150), 2000]), 100))?.fires).toBe(true);
    expect(up(detectLongRun(days([...Array(5).fill(2000), ...Array(7).fill(2150), 2000, 2000]), 100))?.fires).toBe(false);
  });

  it('does not run without a target', () => {
    expect(detectLongRun(trendDays(start, Array(14).fill(2150)), 100)).toBeUndefined();
  });
});

describe('D4b, a short run against the baseline', () => {
  it('fires on 4 days each beyond the baseline median + 1σ, the mean at least δ over', () => {
    const days = trendDays(start, [...steady(1000, 30), 1200, 1200, 1200, 1200]);
    const found = up(detectShortRun(days, start.addDays(20), 10, 100));
    expect(found).toMatchObject({ fires: true, strong: false, n: 4, effect: 200, onset: start.addDays(30) });
    expect(down(detectShortRun(days, start.addDays(20), 10, 100))?.fires).toBe(false);
  });

  it('needs 14 eligible baseline days in the 28 before the run', () => {
    const days = trendDays(start, [...steady(1000, 10), 1200, 1200, 1200, 1200]);
    expect(detectShortRun(days, start, 10, 100)).toBeUndefined();
  });
});

describe('D5, day of week', () => {
  const asOf = start.addDays(27);
  const blocksOf = (days: readonly TrendDay[]) => weekBlocksOf(days, days[0]!.date, days[days.length - 1]!.date);

  it('splits the window into whole 7-day blocks ending yesterday, most recent first', () => {
    const blocks = blocksOf(trendDays(start, Array(30).fill(1)));
    expect(blocks).toHaveLength(4);
    expect(blocks[0]![6]!.date).toBe(start.addDays(29));
    expect(blocks[3]![0]!.date).toBe(start.addDays(2));
  });

  it('the weekend fires when every week is at least δ over the rest of the week', () => {
    const days = trendDays(start, Array.from({ length: 28 }, (_, i) => (start.addDays(i).isWeekend ? 2300 : 2000)));
    expect(days[days.length - 1]!.date).toBe(asOf);
    expect(up(detectWeekend(blocksOf(days), 100))).toMatchObject({ fires: true, n: 4, k: 4, effect: 300, weekday: 'weekend' });
  });

  it('the weekend fires on 80% of 5 weeks, and not on 60%', () => {
    const weekendValue = (miss: ReadonlySet<number>) => (i: number) =>
      start.addDays(i).isWeekend && !miss.has(Math.floor(i / 7)) ? 2300 : 2000;
    const four = trendDays(start, Array.from({ length: 35 }, (_, i) => weekendValue(new Set([0]))(i)));
    expect(up(detectWeekend(blocksOf(four), 100))?.fires).toBe(true);
    const three = trendDays(start, Array.from({ length: 35 }, (_, i) => weekendValue(new Set([0, 1]))(i)));
    expect(up(detectWeekend(blocksOf(three), 100))?.fires).toBe(false);
  });

  it('one weekday fires when every week it is at least max(δ, σ) over the rest of its week', () => {
    const days = trendDays(start, Array.from({ length: 28 }, (_, i) => (start.addDays(i).weekday === 1 ? 2400 : 2000)));
    expect(up(detectWeekday(blocksOf(days), 100, 10))).toMatchObject({ fires: true, weekday: 1, effect: 400, n: 4 });
    // σ above δ raises the bar.
    expect(up(detectWeekday(blocksOf(days), 100, 500))?.fires).toBe(false);
  });

  // MM-614's rule: 3 of the last 4 weeks, each with 5 logged days, the weekday more than half of the gaps.
  const sundaysOff = () =>
    Array.from({ length: 28 }, (_, i): number | undefined => (start.addDays(i).weekday === 0 ? undefined : 2000));

  it('an unlogged weekday fires when the same day is unlogged in 3 of the last 4 weeks and is most of the gaps', () => {
    expect(down(detectUnloggedWeekday(blocksOf(trendDays(start, sundaysOff()))))).toMatchObject({
      fires: true,
      weekday: 0,
      k: 4,
      effect: 4,
    });

    // A week with a second gap still has 5 logged days and counts; Sunday is 4 of the 6 gaps.
    const values = sundaysOff();
    for (const week of [0, 1]) values[week * 7 + 3] = undefined;
    expect(down(detectUnloggedWeekday(blocksOf(trendDays(start, values))))).toMatchObject({ fires: true, weekday: 0, k: 4 });
  });

  it('an unlogged weekday that is not most of the gaps is not a habit', () => {
    // Sunday in 3 of 4 weeks, but each week has another gap on a different day, and the last a third: 3 of 8 gaps.
    const values = sundaysOff();
    values[27] = 2000;
    for (const week of [0, 1, 2, 3]) values[week * 7 + week] = undefined;
    values[25] = undefined;
    const found = down(detectUnloggedWeekday(blocksOf(trendDays(start, values))));
    expect(found).toMatchObject({ weekday: 0, k: 3, fires: false });
    expect(found?.ratio).toBeLessThan(1);
  });

  it('a week with fewer than 5 logged days does not count toward an unlogged weekday', () => {
    // Sunday every week, but weeks 0 and 1 have two more gaps each: 4 logged days.
    const values = sundaysOff();
    for (const week of [0, 1]) {
      values[week * 7 + 2] = undefined;
      values[week * 7 + 3] = undefined;
    }
    expect(down(detectUnloggedWeekday(blocksOf(trendDays(start, values))))).toMatchObject({ k: 2, fires: false });
  });

  it('days before the first log are not gaps', () => {
    // Nothing logged in the first week; then Sunday is the one gap of each of the last 3 weeks.
    const values = sundaysOff();
    for (let i = 0; i < 7; i++) values[i] = undefined;
    const blocks = blocksOf(trendDays(start, values));
    expect(down(detectUnloggedWeekday(blocks))).toMatchObject({ fires: true, weekday: 0, k: 3 });
    // Had the person logged before the window, that empty week would be 7 gaps, and Sunday 3 of 10.
    expect(down(detectUnloggedWeekday(blocks, start.addDays(-30)))?.fires).toBe(false);
  });

  it('does not run under 3 weeks', () => {
    expect(detectWeekend(blocksOf(trendDays(start, Array(14).fill(2000))), 100)).toBeUndefined();
    expect(detectUnloggedWeekday(blocksOf(trendDays(start, Array(14).fill(2000))))).toBeUndefined();
  });
});

describe('D6, recent against baseline', () => {
  const asOf = start.addDays(34);

  it('fires when the last 7 days differ from the 28 before by the statistic and at least δ', () => {
    const points = eligible(trendDays(start, [...steady(1000, 28), ...steady(1100, 7, 10, 28)]));
    const found = up(detectRecentAgainstBaseline(points, asOf, 10, 50));
    expect(found).toMatchObject({ fires: true, strong: true, k: 7, n: 35, onset: start.addDays(28) });
    expect(found?.effect).toBeCloseTo(102.68, 1);
  });

  it('needs 5 recent and 14 baseline eligible days', () => {
    const values: (number | undefined)[] = [...steady(1000, 28), ...steady(1100, 7, 10, 28)];
    for (const i of [28, 30, 32]) values[i] = undefined;
    expect(detectRecentAgainstBaseline(eligible(trendDays(start, values)), asOf, 10, 50)).toBeUndefined();
  });
});
