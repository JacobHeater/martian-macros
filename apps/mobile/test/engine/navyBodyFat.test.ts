import { describe, expect, it } from 'vitest';
import { CalendarDate, type MeasurementSite, SiteObservation, WaistObservation } from '../../src/domain';
import { BodyFatRule, combineBodyFatEstimates, estimateBodyFat, navyBodyFat } from '../../src/engine';
import { typicalSetup } from '../../src/fixtures/typicalSetup';

/** MM-501: the Navy tape method joins the body-fat range. */
const today = CalendarDate.of(2026, 10, 21);
const weekly = (count: number, cm: number) =>
  Array.from({ length: count }, (_, i) => new WaistObservation({ date: today.addDays(-7 * i), waistCm: cm, readings: [cm, cm, cm] }));
const site = (name: MeasurementSite, values: readonly number[]) =>
  values.map((cm, i) => new SiteObservation({ site: name, date: today.addDays(-7 * i), valueCm: cm, readings: [cm, cm, cm] }));

describe('the Navy formula', () => {
  it('agrees with the published imperial equation: a man of 180 cm, waist 90, neck 38, 19.9%', () => {
    // An independent reference, worked by hand from the imperial form (inches):
    // 86.010 log10(35.433 - 14.961) - 70.041 log10(70.866) + 36.76 = 112.774 - 129.607 + 36.76 = 19.93.
    // The metric form the app uses gives 19.81; the two published forms differ by about a tenth of a point.
    const man = navyBodyFat({ sex: 'male', heightCm: 180, waistCm: 90, neckCm: 38, circumferenceNoiseCm: 0 });
    expect(Math.abs((man?.percent ?? 0) - 19.93)).toBeLessThan(0.2);
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

  });

  it('A female profile: the Navy method is not used, since its waist is the narrowest and the app’s is at the navel', () => {
    const herWithout = estimate(woman, [], 78);
    const her = estimate(woman, [...site('neck', [33, 33, 33]), ...site('hips', [100, 100, 100])], 78);
    expect(her.basis).toBe('waist');
    expect(her).toEqual(herWithout);
  });

  it('the neck’s middle carries the neck’s own noise, a quarter less efficient than a mean', () => {
    // Neck noise 0.5 cm per entry (MeasurementSite), x sqrt(1.25) for the middle of four, over sqrt(4);
    // the waist's 1 cm over sqrt(4). The tape's part of the spread is that noise carried through the formula.
    const fourNecks = estimate(man, site('neck', [38, 38, 38, 38]));
    const neckNoise = (0.5 * Math.sqrt(1.25)) / 2;
    const waistNoise = 1 / 2;
    const expected = navyBodyFat({
      sex: 'male',
      heightCm: man.profile.heightCm,
      waistCm: 90,
      neckCm: 38,
      circumferenceNoiseCm: Math.sqrt(waistNoise ** 2 + neckNoise ** 2),
    });
    if (expected === undefined) throw new Error('the Navy method reads these');
    const joined = combineBodyFatEstimates(estimate(man, []).estimate, expected, BodyFatRule.navyErrorCorrelation);
    expect(fourNecks.basis).toBe('tape');
    expect(fourNecks.estimate.percent).toBeCloseTo(joined.percent, 9);
    expect(fourNecks.estimate.sigmaPercent).toBeCloseTo(joined.sigmaPercent, 9);
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
