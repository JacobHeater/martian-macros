import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { MeasurementSite } from '../../src/domain/measurements/MeasurementSite';
import { SiteObservation } from '../../src/domain/measurements/SiteObservation';
import { leanGainPairOf } from '../../src/engine/leanGainPairOf';
import { limbFactsOf } from '../../src/engine/limbFactsOf';
import { siteChangeOf } from '../../src/engine/siteChangeOf';
import { suggestedSites } from '../../src/engine/suggestedSites';
import { Fmt } from '../../src/format/Fmt';
import { leanGainPairText } from '../../src/format/leanGainPairText';
import { limbFactText } from '../../src/format/limbFactText';

/** MM-156: measuring more than the waist. */
const today = CalendarDate.of(2026, 10, 5);

/**
 * Weekly measurements of `site` over the last twelve weeks, from `fromCm` to `toCm` in even steps, kept without their
 * readings, so the waist's noise is its starting 1.0 cm.
 */
const weekly = (site: MeasurementSite, fromCm: number, toCm: number): SiteObservation[] =>
  Array.from({ length: 13 }, (_, i) => {
    const cm = fromCm + ((toCm - fromCm) * i) / 12;
    return new SiteObservation({ site, date: today.addDays(-7 * (12 - i)), valueCm: cm });
  });

describe('the suggested sites, offered once', () => {
  const none = new Set<MeasurementSite>();

  it('Suggested once: a female profile on recomp with only waist is offered hips, upper arm and thigh', () => {
    expect(suggestedSites({ sex: 'female', goal: 'recomp', eatingDisorderHistory: false, measured: none })).toEqual([
      'hips',
      'upperArm',
      'thigh',
    ]);
  });

  it('Sex-specific suggestion: hips are not in a male profile’s default suggestion', () => {
    expect(suggestedSites({ sex: 'male', goal: 'fatLoss', eatingDisorderHistory: false, measured: none })).toEqual([]);
    expect(suggestedSites({ sex: 'male', goal: 'leanGain', eatingDisorderHistory: false, measured: none })).toEqual(['upperArm', 'thigh']);
  });

  it('a tape body-fat estimate adds neck, and hips for a female profile', () => {
    expect(suggestedSites({ sex: 'male', goal: 'fatLoss', eatingDisorderHistory: false, measured: none, tapeBodyFat: true })).toEqual(['neck']);
    expect(suggestedSites({ sex: 'female', goal: 'fatLoss', eatingDisorderHistory: false, measured: none, tapeBodyFat: true })).toEqual([
      'neck',
      'hips',
    ]);
  });

  it('Eating-disorder history: no additional site is suggested', () => {
    expect(suggestedSites({ sex: 'female', goal: 'recomp', eatingDisorderHistory: true, measured: none, tapeBodyFat: true })).toEqual([]);
  });

  it('a site already measured is not suggested again', () => {
    expect(suggestedSites({ sex: 'female', goal: 'recomp', eatingDisorderHistory: false, measured: new Set(['hips']) })).toEqual([
      'upperArm',
      'thigh',
    ]);
  });
});

describe('a site’s change, by the waist’s rule with its own noise', () => {
  it('a change of about 0.9 cm is beyond an upper arm’s noise and not beyond a waist’s', () => {
    const arm = weekly('upperArm', 33, 34);
    expect(siteChangeOf({ measurements: arm, site: 'upperArm', asOf: today, days: 84 })?.direction).toBe('up');
    const waist = weekly('waist', 90, 91);
    expect(siteChangeOf({ measurements: waist, site: 'waist', asOf: today, days: 84 })?.direction).toBe('noClearChange');
  });

  it('a single-reading entry outside both ends compared leaves the threshold at 1.4 times the site’s noise', () => {
    const arm = weekly('upperArm', 33, 34);
    const old = new SiteObservation({ site: 'upperArm', date: today.addDays(-140), valueCm: 33, readings: [33] });
    expect(siteChangeOf({ measurements: [old, ...arm], site: 'upperArm', asOf: today, days: 84 })?.thresholdCm).toBeCloseTo(1.4 * 0.5, 9);
    // At an end, it is half as much again.
    const atEnd = new SiteObservation({ site: 'upperArm', date: today, valueCm: 34, readings: [34] });
    const withEnd = [...arm.filter((o) => o.date.epochDay !== today.epochDay), atEnd];
    expect(siteChangeOf({ measurements: withEnd, site: 'upperArm', asOf: today, days: 84 })?.thresholdCm).toBeCloseTo(1.4 * 0.5 * 1.5, 9);
  });

  it('only that site’s entries are read', () => {
    expect(siteChangeOf({ measurements: weekly('thigh', 58, 60), site: 'calf', asOf: today })).toBeUndefined();
  });
});

describe('Limits of a tape', () => {
  const fmt = new Fmt('metric');

  it('upper arm up 1.0 cm beyond noise and waist with no clear change: both facts, nothing about muscle', () => {
    const facts = limbFactsOf({
      measurements: [...weekly('waist', 90, 90), ...weekly('upperArm', 33, 34)],
      sites: new Set(['upperArm']),
      asOf: today,
    });
    expect(facts).toHaveLength(1);
    const text = limbFactText(facts[0]!, fmt, 'left');
    expect(text).toBe('Upper arm (left) up 1.0 cm in 12 weeks while waist held.');
    expect(text).not.toMatch(/muscle|fat|lean|grew|gain/i);
  });

  // The waist's change is the shared change function's (MM-155), from the ends of the period, not the first and last entry.
  it('a limb not added says nothing, and one with no clear change says so', () => {
    const measurements = [...weekly('waist', 92, 90), ...weekly('thigh', 58, 58.2), ...weekly('calf', 38, 39)];
    const facts = limbFactsOf({ measurements, sites: new Set(['thigh']), asOf: today });
    expect(facts.map((f) => f.site)).toEqual(['thigh']);
    expect(limbFactText(facts[0]!, fmt)).toBe('Thigh: no clear change in 12 weeks while waist went down 1.5 cm.');
  });

  it('in a lean gain, limbs up with the waist steady is consistent with the gain, and the reverse with the fat-heavy notice', () => {
    const gain = limbFactsOf({
      measurements: [...weekly('waist', 90, 90), ...weekly('upperArm', 33, 34), ...weekly('thigh', 58, 60)],
      sites: new Set(['upperArm', 'thigh']),
      asOf: today,
    });
    expect(leanGainPairOf(gain)).toBe('limbsUpWaistSteady');
    expect(leanGainPairText('limbsUpWaistSteady')).toMatch(/^Limbs up while the waist held is consistent with/);
    const fatHeavy = limbFactsOf({
      measurements: [...weekly('waist', 90, 93), ...weekly('upperArm', 33, 33), ...weekly('thigh', 58, 58)],
      sites: new Set(['upperArm', 'thigh']),
      asOf: today,
    });
    expect(leanGainPairOf(fatHeavy)).toBe('waistUpLimbsSteady');
    expect(leanGainPairText('waistUpLimbsSteady')).toMatch(/consistent with/);
    expect(leanGainPairOf([])).toBeUndefined();
  });

  it('one limb alone just past its threshold says nothing together; one well past it, or two limbs up, does', () => {
    const facts = (arm: number, thigh?: number) =>
      limbFactsOf({
        measurements: [...weekly('waist', 90, 90), ...weekly('upperArm', 33, arm), ...(thigh === undefined ? [] : weekly('thigh', 58, thigh))],
        sites: new Set<MeasurementSite>(thigh === undefined ? ['upperArm'] : ['upperArm', 'thigh']),
        asOf: today,
      });
    // Up about 0.83 cm against a threshold of 0.7: up, but one limb alone needs 1.05.
    const barely = facts(34);
    expect(barely[0]?.limb.direction).toBe('up');
    expect(leanGainPairOf(barely)).toBeUndefined();
    // With a second limb measured and steady, still nothing.
    expect(leanGainPairOf(facts(34, 58))).toBeUndefined();
    // Up about 1.67 cm: well past it.
    expect(leanGainPairOf(facts(35))).toBe('limbsUpWaistSteady');
    // Two limbs up, each just past: together they count.
    expect(leanGainPairOf(facts(34, 59.5))).toBe('limbsUpWaistSteady');
  });
});
