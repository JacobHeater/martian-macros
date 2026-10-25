import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import { binomialCriticalCount, robustSigma, type TrendPoint } from '../../src/engine';
import { mannKendallZ } from '../../src/engine/trends/mannKendallZ';
import { pooledSigma } from '../../src/engine/trends/pooledSigma';
import { roundedEffect } from '../../src/engine/trends/roundedEffect';
import { theilSenSlope } from '../../src/engine/trends/theilSenSlope';
import { twoSampleShift } from '../../src/engine/trends/twoSampleShift';

/** MM-605: the trend engine's primitives. */
const start = CalendarDate.of(2026, 9, 1);
const points = (values: readonly number[], relativeSigma = 0): TrendPoint[] =>
  values.map((value, i) => ({ date: start.addDays(i), value, eligible: true, reason: undefined, relativeSigma }));

describe('k_crit, the exact one-sided sign test at p 0.5', () => {
  // The fewest days of n on one side with P(X ≥ k) ≤ α.
  const at05: [number, number][] = [
    [7, 7],
    [8, 7],
    [9, 8],
    [10, 9],
    [11, 9],
    [12, 10],
    [13, 10],
    [14, 11],
    [15, 12],
    [20, 15],
    [25, 18],
    [30, 20],
  ];
  for (const [n, k] of at05) {
    it(`k_crit(${n}) at α 0.05 is ${k}`, () => expect(binomialCriticalCount(n, 0.05)).toBe(k));
  }

  it('at α 0.005, strong, it is stricter', () => {
    expect(binomialCriticalCount(8, 0.005)).toBe(8);
    expect(binomialCriticalCount(10, 0.005)).toBe(10);
    expect(binomialCriticalCount(14, 0.005)).toBe(13);
    expect(binomialCriticalCount(20, 0.005)).toBe(17);
  });

  it('is more than n when no count is rare enough', () => {
    // 4 of 4 has probability 1/16, above 0.05.
    expect(binomialCriticalCount(4, 0.05)).toBe(5);
  });
});

describe('the robust spread', () => {
  it('is 1.4826 times the median absolute deviation, so one wild day does not widen it', () => {
    expect(robustSigma(points([1, 2, 3, 4, 100]), 0)).toBeCloseTo(1.4826, 4);
  });

  it("is floored by the signal's floor", () => {
    expect(robustSigma(points([1, 2, 3, 4, 100]), 5)).toBe(5);
  });

  it("is floored by the days' own measurement uncertainty, so a very regular logger does not fire on trivial changes", () => {
    expect(robustSigma(points([2000, 2000, 2000, 2000, 2000], 0.1), 10)).toBeCloseTo(200, 6);
  });

  it('pooled, it reads each segment about its own median, so a step does not widen it', () => {
    expect(pooledSigma([[1, 2, 3], [11, 12, 13]], 0)).toBeCloseTo(1.4826, 4);
  });

  it('the two-sample statistic is the difference over its standard error', () => {
    const { difference, t } = twoSampleShift([1, 2, 3], [11, 12, 13], 0);
    expect(difference).toBe(10);
    expect(t).toBeCloseTo(10 / (1.4826 * Math.sqrt(2 / 3)), 6);
  });
});

describe('Theil–Sen and Mann–Kendall', () => {
  it('the Theil–Sen slope ignores an outlier', () => {
    const values = Array.from({ length: 10 }, (_, i) => (i === 5 ? 1000 : 10 + 3 * i));
    expect(theilSenSlope(points(values))).toBe(3);
  });

  it('Mann–Kendall on a steady rise is (S − 1) / √Var(S)', () => {
    const rising = points(Array.from({ length: 10 }, (_, i) => i));
    // S = 45 and Var(S) = 10 · 9 · 25 / 18 = 125; the residuals are all zero, so no autocorrelation.
    expect(mannKendallZ(rising, 1)).toBeCloseTo(44 / Math.sqrt(125), 6);
    const falling = points(Array.from({ length: 10 }, (_, i) => -i));
    expect(mannKendallZ(falling, -1)).toBeCloseTo(-44 / Math.sqrt(125), 6);
  });

  it('lag-1 autocorrelation shrinks n, and so the score', () => {
    // A rise with blocks of four days above and below it: the residuals run together.
    const values = Array.from({ length: 24 }, (_, i) => 10 * i + (Math.floor(i / 4) % 2 === 0 ? 33 : -33));
    const series = points(values);
    let s = 0;
    for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) s += Math.sign(values[j]! - values[i]!);
    const n = values.length;
    const uncorrected = (s - 1) / Math.sqrt((n * (n - 1) * (2 * n + 5)) / 18);
    const z = mannKendallZ(series, theilSenSlope(series));
    expect(z).toBeGreaterThan(0);
    expect(z).toBeLessThan(uncorrected);
  });
});

describe('rounding (MM-341)', () => {
  it('rounds half away from zero to the step', () => {
    expect(roundedEffect(149, 10)).toBe(150);
    expect(roundedEffect(-145, 10)).toBe(-150);
    expect(roundedEffect(0.1 + 0.2, 0.1)).toBe(0.3);
  });

  it('never gives a signed zero', () => {
    expect(Object.is(roundedEffect(-0.4, 1), 0)).toBe(true);
    expect(Object.is(roundedEffect(-4, 10), 0)).toBe(true);
  });
});
