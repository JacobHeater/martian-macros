import { describe, expect, it } from 'vitest';
import { type BodyFatObservation, CalendarDate, WaistObservation, type WeightObservation } from '../../src/domain';
import { analyze, BodyFatRule, estimateBodyFat, scaleBodyFat } from '../../src/engine';
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

  it('A settled range: eight weeks from one scale and weekly tape give a range a few points wide', () => {
    const readings = daily('scale-a', 55, 0, scattered);
    const result = on(today, readings);
    const without = on(today, []);
    expect(result.basis).toBe('scale');
    expect(result.scaleDays).toBe(BodyFatRule.scaleWindowDays);
    const width = result.estimate.upperPercent - result.estimate.lowerPercent;
    expect(width).toBeLessThan(8);
    expect(width).toBeLessThan(without.estimate.upperPercent - without.estimate.lowerPercent);
    // Filtering removes scatter, not the scale's fixed bias: never narrower than that bias allows.
    expect(result.estimate.sigmaPercent).toBeGreaterThan(1);
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

  it('One overnight spike 3 points above the day before does not move the shown range, then or at the next update', () => {
    // The first reading 55 days ago: the update day was 6 days ago, and is next tomorrow.
    const steady = daily('scale-a', 55, -1, () => 20);
    const spiked = steady.map((r) => (r.date === today ? { ...r, percent: 23 } : r));
    expect(on(today, spiked).estimate).toEqual(on(today, steady).estimate);
    expect(on(today.addDays(1), spiked).estimate).toEqual(on(today.addDays(1), steady).estimate);
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
