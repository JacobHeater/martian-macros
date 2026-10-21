import { describe, expect, it } from 'vitest';
import { CalendarDate, WaistObservation, type WeightObservation } from '../../src/domain';
import {
  analyze,
  BodyFatEstimate,
  BodyFatRule,
  combineBodyFatEstimates,
  deurenbergBodyFat,
  estimateBodyFat,
  relativeFatMass,
} from '../../src/engine';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { expectClose } from '../support/expectClose';

/** MM-34: a body-fat range from the user's own measurements. */
const today = CalendarDate.of(2026, 10, 21);
// A man, 180 cm, born 1990: 36 today.
const setup = typicalSetup();
const formula = deurenbergBodyFat({ sex: 'male', weightKg: 85, heightCm: 180, ageYears: 36 });

/** One weekly entry per figure, the last today. */
const weekly = (...cm: number[]) =>
  cm.map((waistCm, i) => new WaistObservation({ date: today.addDays(-7 * (cm.length - 1 - i)), waistCm, readings: [waistCm, waistCm, waistCm] }));

const estimate = (waists: readonly WaistObservation[], s = setup) => estimateBodyFat({ setup: s, trendWeightKg: 85, waists, today });

describe('relativeFatMass', () => {
  it('is 64 - 20 x height / waist for men, 76 - for women', () => {
    expectClose(relativeFatMass({ sex: 'male', heightCm: 180, waistCm: 90, waistNoiseCm: 0 }).percent, 24, 1e-9);
    expectClose(relativeFatMass({ sex: 'female', heightCm: 165, waistCm: 80, waistNoiseCm: 0 }).percent, 34.75, 1e-9);
  });

  it('carries the formula error, widened a little by the tape', () => {
    expectClose(relativeFatMass({ sex: 'male', heightCm: 180, waistCm: 90, waistNoiseCm: 0 }).sigmaPercent, BodyFatRule.waistFormulaSigmaPercent, 1e-9);
    const noisy = relativeFatMass({ sex: 'male', heightCm: 180, waistCm: 90, waistNoiseCm: 2 });
    expect(noisy.sigmaPercent).toBeGreaterThan(BodyFatRule.waistFormulaSigmaPercent);
  });

  it('keeps a mistyped waist within a possible body fat', () => {
    expect(relativeFatMass({ sex: 'male', heightCm: 180, waistCm: 30, waistNoiseCm: 0 }).percent).toBe(3);
  });
});

describe('combineBodyFatEstimates', () => {
  const a = new BodyFatEstimate({ percent: 20, sigmaPercent: 4 });
  const b = new BodyFatEstimate({ percent: 30, sigmaPercent: 4 });

  it('independent equal errors: the mean, narrower by the square root of two', () => {
    const c = combineBodyFatEstimates(a, b, 0);
    expectClose(c.percent, 25, 1e-9);
    expectClose(c.sigmaPercent, 4 / Math.SQRT2, 1e-9);
  });

  it('correlated errors narrow it less', () => {
    expect(combineBodyFatEstimates(a, b, 0.5).sigmaPercent).toBeGreaterThan(combineBodyFatEstimates(a, b, 0).sigmaPercent);
    expectClose(combineBodyFatEstimates(a, b, 1).sigmaPercent, 4, 1e-9);
  });

  it('always lies between the two', () => {
    const wide = new BodyFatEstimate({ percent: 30, sigmaPercent: 10 });
    const c = combineBodyFatEstimates(a, wide, 0.9);
    expect(c.percent).toBeGreaterThanOrEqual(20);
    expect(c.percent).toBeLessThanOrEqual(30);
    expect(c.sigmaPercent).toBeLessThanOrEqual(10);
  });
});

describe('estimateBodyFat', () => {
  it('the user’s own figure is used as given', () => {
    const result = estimate(weekly(90, 90, 90, 90), setup.copyWith({ bodyFatPercent: 18 }));
    expect(result.basis).toBe('yourFigure');
    expect(result.estimate.percent).toBe(18);
  });

  it('before enough data: the rough formula range', () => {
    expect(estimate([]).estimate).toEqual(formula);
    const two = estimate(weekly(90, 90));
    expect(two.basis).toBe('formula');
    expect(two.estimate).toEqual(formula);
  });

  it('entries older than the window do not count', () => {
    // 28, 21 and 14 days ago: only two inside the 28-day window.
    const old = weekly(90, 90, 90, 90, 90).slice(0, 3);
    expect(old[0]?.date.daysUntil(today)).toBe(BodyFatRule.waistWindowDays);
    expect(estimate(old).basis).toBe('formula');
  });

  it('weekly waist entries narrow the range, but correlated formulas never to a point', () => {
    const result = estimate(weekly(90, 90, 90, 90));
    expect(result.basis).toBe('waist');
    expect(result.waistEntries).toBe(4);
    expect(result.estimate.sigmaPercent).toBeLessThan(formula.sigmaPercent);
    // Two outside formulas, errors going together: still about 8 points either way.
    expect(result.estimate.sigmaPercent).toBeGreaterThan(4);
    expect(result.estimate.percent).toBeGreaterThan(Math.min(formula.percent, 24) - 1e-9);
    expect(result.estimate.percent).toBeLessThan(Math.max(formula.percent, 24) + 1e-9);
  });

  it('one mistyped entry does not move the range', () => {
    const steady = estimate(weekly(90, 90, 90, 90)).estimate;
    const typo = estimate(weekly(90, 90, 96, 90)).estimate;
    expect(typo.percent).toBe(steady.percent);
    expect(typo.lowerPercent).toBe(steady.lowerPercent);
    expect(typo.upperPercent).toBe(steady.upperPercent);
  });

  it('single readings are noisier than the middle of three', () => {
    const three = estimate(weekly(90, 90, 90)).estimate;
    const single = estimate(weekly(90, 90, 90).map((w) => new WaistObservation({ date: w.date, waistCm: w.waistCm, readings: [w.waistCm] }))).estimate;
    expect(single.sigmaPercent).toBeGreaterThan(three.sigmaPercent);
  });
});

it('analyze works from the waist when it has one (MM-34)', () => {
  const weights: WeightObservation[] = Array.from({ length: 28 }, (_, i) => ({ date: today.addDays(i - 27), weightKg: 85 }));
  const without = analyze({ setup, weights, intake: [], today });
  const withWaist = analyze({ setup, weights, intake: [], today, waists: weekly(90, 90, 90, 90) });
  expect(without?.bodyFatBasis).toBe('formula');
  expect(withWaist?.bodyFatBasis).toBe('waist');
  expect(withWaist?.bodyFat.sigmaPercent).toBeLessThan(without?.bodyFat.sigmaPercent ?? 0);
});
