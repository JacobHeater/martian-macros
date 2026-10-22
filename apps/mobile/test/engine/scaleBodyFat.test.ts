import { describe, expect, it } from 'vitest';
import { type BodyFatObservation, CalendarDate, WaistObservation, type WeightObservation } from '../../src/domain';
import { analyze, BodyFatRule, cautiousBodyFatPercent, estimateBodyFat, SafetyBounds, scaleBodyFat } from '../../src/engine';
import { typicalSetup } from '../../src/fixtures/typicalSetup';

/** MM-502: a smart scale's body-fat readings narrow the range, with each scale's own bias. */
const today = CalendarDate.of(2026, 10, 21);
// A man, 180 cm, born 1990: 36 today, 85 kg.
const setup = typicalSetup();

/** One reading a day from `scale`, from `from` days ago to `to` days ago, each `percent(daysAgo)`. */
const daily = (scale: string, from: number, to: number, percent: (daysAgo: number) => number): BodyFatObservation[] => {
  const readings: BodyFatObservation[] = [];
  for (let ago = from; ago >= to; ago--) {
    readings.push({ date: today.addDays(-ago), percent: percent(ago), method: 'bia', deviceId: scale });
  }
  return readings;
};

/** Two points of overnight scatter: 19 and 21 on alternate days. */
const scattered = (ago: number) => (ago % 2 === 0 ? 19 : 21);

/** A weekly tape measurement over the last eight weeks. */
const tape = Array.from({ length: 8 }, (_, i) => new WaistObservation({ date: today.addDays(-7 * i), waistCm: 90, readings: [90, 90, 90] }));

const on = (day: CalendarDate, readings: readonly BodyFatObservation[], waists: readonly WaistObservation[] = tape) =>
  estimateBodyFat({
    setup,
    trendWeightKg: 85,
    waists,
    bodyFatReadings: readings.filter((r) => !r.date.isAfter(day)),
    today: day,
  });

describe('estimateBodyFat with a smart scale', () => {
  it('Before enough data: a week of readings leaves the range as it was, and never shows a number from the scale', () => {
    const week = daily('scale-a', 6, 0, () => 12);
    const result = on(today, week);
    const without = on(today, []);
    expect(result.basis).toBe('waist');
    expect(result.estimate).toEqual(without.estimate);
    expect(scaleBodyFat({ readings: week, today })).toBeUndefined();
  });

  it('A settled range: eight weeks from one scale and weekly tape narrow the range, never past what the scale’s bias allows', () => {
    const readings = daily('scale-a', 55, 0, scattered);
    const result = on(today, readings);
    const without = on(today, []);
    expect(result.basis).toBe('scale');
    expect(result.scaleDays).toBe(BodyFatRule.scaleWindowDays);
    const width = result.estimate.upperPercent - result.estimate.lowerPercent;
    expect(width).toBeLessThan(without.estimate.upperPercent - without.estimate.lowerPercent);
    // Filtering removes scatter, not the scale's fixed bias (4.5 points against a scan, with its error
    // partly shared with the formulas'): the joined range stays at least three points either side.
    expect(result.estimate.sigmaPercent).toBeGreaterThan(3);
  });

  it('A scale may only make safety stricter: one reading 5 points above the formula lifts no safety figure', () => {
    const without = on(today, []);
    const high = daily('scale-a', 55, 0, () => without.estimate.percent + 5);
    const result = on(today, high);
    expect(result.basis).toBe('scale');
    // The shown middle moves toward the scale ...
    expect(result.estimate.percent).toBeGreaterThan(without.estimate.percent);
    // ... but the figure the safety thresholds read does not rise, and the fat-free mass the floor uses does not fall.
    expect(cautiousBodyFatPercent(result.estimate)).toBeLessThanOrEqual(cautiousBodyFatPercent(without.estimate));
    expect(result.estimate.fatFreeMassUpperKg(85)).toBeGreaterThanOrEqual(without.estimate.fatFreeMassUpperKg(85));
    const floor = (estimate: typeof result.estimate) =>
      SafetyBounds.calorieFloorKcal({
        sex: 'male',
        bmrKcal: 0,
        bodyFatPercent: cautiousBodyFatPercent(estimate),
        fatFreeMassUpperKg: estimate.fatFreeMassUpperKg(85),
        trainingKcalPerDay: 0,
      });
    expect(floor(result.estimate)).toBeGreaterThanOrEqual(floor(without.estimate));
  });

  it('A scale reading lower than the formula may make safety stricter', () => {
    const without = on(today, []);
    const result = on(today, daily('scale-a', 55, 0, () => without.estimate.percent - 5));
    expect(cautiousBodyFatPercent(result.estimate)).toBeLessThan(cautiousBodyFatPercent(without.estimate));
  });

  it('A scale back after a gap longer than the window settles again before it counts', () => {
    // Six weeks of readings ending 50 days ago, then ten days of readings up to today.
    const readings = [...daily('scale-a', 90, 50, () => 20), ...daily('scale-a', 9, 0, () => 20)];
    expect(scaleBodyFat({ readings, today })).toBeUndefined();
    expect(on(today, readings).estimate).toEqual(on(today, []).estimate);
    // Once the resumed run spans the settling time, it counts again.
    const resumed = [...daily('scale-a', 90, 50, () => 20), ...daily('scale-a', 21, 0, () => 20)];
    expect(scaleBodyFat({ readings: resumed, today })).toBeDefined();
  });

  it('The same readings from a second source count as the same days, not twice as many', () => {
    const once = daily('scale-a', 55, 0, scattered);
    const copied = [...once, ...daily('health-copy', 55, 0, scattered)];
    const single = scaleBodyFat({ readings: once, today });
    const both = scaleBodyFat({ readings: copied, today });
    expect(both?.days).toBe(single?.days);
    expect(both?.estimate).toEqual(single?.estimate);
  });

  it('updated weekly: between update days the range does not change', () => {
    const readings = daily('scale-a', 55, -6, scattered);
    const level = scaleBodyFat({ readings: readings.filter((r) => !r.date.isAfter(today)), today });
    const asOf = level?.asOf ?? today;
    const first = on(asOf, readings);
    for (let d = 1; d < 7; d++) {
      expect(on(asOf.addDays(d), readings).estimate).toEqual(first.estimate);
    }
    expect(on(asOf.addDays(7), readings.map((r) => ({ ...r, percent: r.percent + 2 }))).estimate).not.toEqual(first.estimate);
  });

  it('A new scale that reads 4 points higher: the shown range does not jump', () => {
    // Eight weeks on scale A at 20%, then scale B from two weeks ago, reading 24% of the same body.
    const readings = [...daily('scale-a', 70, 15, () => 20), ...daily('scale-b', 14, 0, () => 24)];
    const settled = on(today.addDays(-15), readings);
    expect(settled.basis).toBe('scale');
    for (let ago = 14; ago >= 0; ago--) {
      const day = on(today.addDays(-ago), readings);
      expect(day.basis, `${ago} days ago`).toBe('scale');
      expect(Math.abs(day.estimate.percent - settled.estimate.percent), `${ago} days ago`).toBeLessThan(0.25);
      expect(Math.abs(day.estimate.upperPercent - settled.estimate.upperPercent), `${ago} days ago`).toBeLessThan(0.5);
    }
  });

  it('One overnight spike 3 points above the day before does not move the shown range, on its update day or the next', () => {
    // The first reading 56 days ago: today is an update day, so the spike is inside the window that counts.
    const steady = daily('scale-a', 56, -7, () => 20);
    const spiked = steady.map((r) => (r.date.epochDay === today.epochDay ? { ...r, percent: 23 } : r));
    expect(scaleBodyFat({ readings: spiked, today })?.asOf.epochDay).toBe(today.epochDay);
    expect(on(today, spiked).estimate).toEqual(on(today, steady).estimate);
    expect(on(today.addDays(7), spiked).estimate).toEqual(on(today.addDays(7), steady).estimate);
  });

  it('the user’s own figure still comes first', () => {
    const result = estimateBodyFat({
      setup: setup.copyWith({ bodyFatPercent: 18 }),
      trendWeightKg: 85,
      waists: [],
      bodyFatReadings: daily('scale-a', 55, 0, scattered),
      today,
    });
    expect(result.basis).toBe('yourFigure');
  });

  it('without the tape, a scale joins the formula alone', () => {
    const result = on(today, daily('scale-a', 55, 0, scattered), []);
    expect(result.basis).toBe('scale');
    expect(result.waistEntries).toBe(0);
  });
});

it('analyze works from the scale once its readings settle (MM-502)', () => {
  const weights: WeightObservation[] = Array.from({ length: 56 }, (_, i) => ({ date: today.addDays(i - 55), weightKg: 85 }));
  const withScale = analyze({ setup, weights, intake: [], today, bodyFatReadings: daily('scale-a', 55, 0, scattered) });
  const without = analyze({ setup, weights, intake: [], today });
  expect(withScale?.bodyFatBasis).toBe('scale');
  expect(withScale?.bodyFat.sigmaPercent).toBeLessThan(without?.bodyFat.sigmaPercent ?? 0);
});
