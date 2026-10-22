import { describe, expect, it } from 'vitest';
import { CalendarDate, type MeasurementSite, SiteObservation, WaistObservation } from '../../src/domain';
import { BodyFatRule, estimateBodyFat, navyBodyFat } from '../../src/engine';
import { typicalSetup } from '../../src/fixtures/typicalSetup';

/** MM-501: the Navy tape method joins the body-fat range. */
const today = CalendarDate.of(2026, 10, 21);
const weekly = (count: number, cm: number) =>
  Array.from({ length: count }, (_, i) => new WaistObservation({ date: today.addDays(-7 * i), waistCm: cm, readings: [cm, cm, cm] }));
const site = (name: MeasurementSite, values: readonly number[]) =>
  values.map((cm, i) => new SiteObservation({ site: name, date: today.addDays(-7 * i), valueCm: cm, readings: [cm, cm, cm] }));

describe('the Navy formula', () => {
  it('gives the published figures: a man of 180 cm, waist 90, neck 38, about 18%', () => {
    const man = navyBodyFat({ sex: 'male', heightCm: 180, waistCm: 90, neckCm: 38, circumferenceNoiseCm: 0 });
    expect(man?.percent).toBeCloseTo(495 / (1.0324 - 0.19077 * Math.log10(52) + 0.15456 * Math.log10(180)) - 450, 9);
    expect(man?.percent).toBeGreaterThan(16);
    expect(man?.percent).toBeLessThan(20);
    expect(man?.sigmaPercent).toBeCloseTo(BodyFatRule.navySigmaPercent, 9);
  });

  it('a woman needs her hip; with it, the female formula', () => {
    expect(navyBodyFat({ sex: 'female', heightCm: 165, waistCm: 75, neckCm: 33, circumferenceNoiseCm: 0 })).toBeUndefined();
    const woman = navyBodyFat({ sex: 'female', heightCm: 165, waistCm: 75, neckCm: 33, hipCm: 100, circumferenceNoiseCm: 0 });
    expect(woman?.percent).toBeCloseTo(495 / (1.29579 - 0.35004 * Math.log10(142) + 0.221 * Math.log10(165)) - 450, 9);
  });

  it('a neck at or above the waist cannot be read, and gives nothing', () => {
    expect(navyBodyFat({ sex: 'male', heightCm: 180, waistCm: 40, neckCm: 40, circumferenceNoiseCm: 0.5 })).toBeUndefined();
  });

  it('tape noise widens it', () => {
    const quiet = navyBodyFat({ sex: 'male', heightCm: 180, waistCm: 90, neckCm: 38, circumferenceNoiseCm: 0 });
    const noisy = navyBodyFat({ sex: 'male', heightCm: 180, waistCm: 90, neckCm: 38, circumferenceNoiseCm: 2 });
    expect(noisy?.sigmaPercent ?? 0).toBeGreaterThan(quiet?.sigmaPercent ?? 0);
  });
});

describe('estimateBodyFat with the tape (MM-501)', () => {
  const man = typicalSetup();
  const woman = typicalSetup({ sex: 'female' });
  const estimate = (setup: typeof man, sites: readonly SiteObservation[], waistCm = 90) =>
    estimateBodyFat({ setup, trendWeightKg: 80, waists: weekly(4, waistCm), sites, today });

  it('Neck and hip entered: three or more of each in four weeks, the range rests on the Navy method as well and is no wider', () => {
    const without = estimate(man, []);
    const withNeck = estimate(man, site('neck', [38, 38, 38, 38]));
    expect(without.basis).toBe('waist');
    expect(withNeck.basis).toBe('tape');
    expect(withNeck.estimate.sigmaPercent).toBeLessThanOrEqual(without.estimate.sigmaPercent + 1e-12);

    const herWithout = estimate(woman, [], 78);
    const her = estimate(woman, [...site('neck', [33, 33, 33]), ...site('hips', [100, 100, 100])], 78);
    expect(her.basis).toBe('tape');
    expect(her.estimate.sigmaPercent).toBeLessThanOrEqual(herWithout.estimate.sigmaPercent + 1e-12);
  });

  it('Only some sites: waist but no neck leaves MM-34’s range unchanged; a woman’s neck without her hip does too', () => {
    const without = estimate(man, []);
    const noNeck = estimate(man, site('chest', [100, 100, 100]));
    expect(noNeck).toEqual(without);
    const twoNecks = estimate(man, site('neck', [38, 38]));
    expect(twoNecks).toEqual(without);
    const herWithout = estimate(woman, [], 78);
    expect(estimate(woman, site('neck', [33, 33, 33]), 78)).toEqual(herWithout);
  });

  it('One mistyped neck entry does not move a settled range', () => {
    const settled = estimate(man, site('neck', [38, 38, 38, 38, 38]));
    const mistyped = estimate(man, site('neck', [83, 38, 38, 38, 38]));
    expect(mistyped.estimate.percent).toBeCloseTo(settled.estimate.percent, 9);
    expect(mistyped.estimate.sigmaPercent).toBeCloseTo(settled.estimate.sigmaPercent, 9);
  });

  it('neck entries older than four weeks do not count', () => {
    const old = [38, 38, 38].map(
      (cm, i) => new SiteObservation({ site: 'neck', date: today.addDays(-BodyFatRule.waistWindowDays - 7 * i), valueCm: cm, readings: [cm] }),
    );
    expect(estimate(man, old).basis).toBe('waist');
  });

  it('without the waist, the tape is not used', () => {
    const none = estimateBodyFat({ setup: man, trendWeightKg: 80, waists: [], sites: site('neck', [38, 38, 38]), today });
    expect(none.basis).toBe('formula');
  });
});
