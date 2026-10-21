import type { BodyFatObservation } from '../domain/BodyFatObservation';
import type { CalendarDate } from '../domain/CalendarDate';
import type { UserSetup } from '../domain/UserSetup';
import type { SiteObservation } from '../domain/measurements/SiteObservation';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import type { WaistObservation } from '../domain/WaistObservation';
import { BodyFatEstimate } from './BodyFatEstimate';
import { BodyFatRule } from './BodyFatRule';
import { combineBodyFatEstimates } from './combineBodyFatEstimates';
import { deurenbergBodyFat } from './deurenbergBodyFat';
import { navyBodyFat } from './navyBodyFat';
import type { EstimatedBodyFat } from './EstimatedBodyFat';
import { relativeFatMass } from './relativeFatMass';
import { scaleBodyFat } from './scaleBodyFat';
import { WaistRule } from './WaistRule';

/** The middle of `values`, which is not empty. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/**
 * The body fat the coach works from (MM-34). The user's own figure when
 * they gave one; otherwise the formula from height, weight, age and sex,
 * joined, once there are `BodyFatRule.minWaistEntries` waist entries in the
 * last `BodyFatRule.waistWindowDays`, by the waist-to-height formula on
 * their middle value; and either joined by a smart scale's readings once
 * they have settled (MM-502, `scaleBodyFat`), each scale's own bias taken
 * out. Pure: the same stored measurements give the same range.
 *
 * With the waist, the Navy tape method (MM-501) joins for a male profile
 * once the neck has as many entries in the same window (not for a female
 * profile: her equation needs the waist at its narrowest, and the app's is
 * at the navel): on the neck's middle value, so one mistyped entry moves
 * nothing, and combined by
 * reliability with its error going together with the formulas'
 * (`BodyFatRule.navyErrorCorrelation`), so the range is never wider for it.
 */
export function estimateBodyFat({
  setup,
  trendWeightKg,
  waists,
  bodyFatReadings = [],
  sites = [],
  today,
}: {
  setup: UserSetup;
  trendWeightKg: number;
  waists: readonly WaistObservation[];
  /** Smart-scale body-fat readings, each with the scale it came from (MM-502). */
  bodyFatReadings?: readonly BodyFatObservation[];
  /** Every site's tape measurements (MM-156); the Navy method reads neck and hip (MM-501). */
  sites?: readonly SiteObservation[];
  today: CalendarDate;
}): EstimatedBodyFat {
  const given = setup.bodyFatPercent;
  if (given !== undefined) {
    return { estimate: new BodyFatEstimate({ percent: given, sigmaPercent: 4 }), basis: 'yourFigure', waistEntries: 0 };
  }
  const outside = fromOutside({ setup, trendWeightKg, waists, sites, today });
  const scale = scaleBodyFat({ readings: bodyFatReadings, today });
  if (scale === undefined) return outside;
  const joined = combineBodyFatEstimates(outside.estimate, scale.estimate, BodyFatRule.scaleErrorCorrelation);
  return {
    // A scale may only make safety stricter: the safety figures also read the estimate without it.
    estimate: new BodyFatEstimate({ percent: joined.percent, sigmaPercent: joined.sigmaPercent, withoutScale: outside.estimate }),
    basis: 'scale',
    waistEntries: outside.waistEntries,
    scaleDays: scale.days,
  };
}

/** The formula, joined by the waist when there are enough entries: what is measured from outside the body. */
function fromOutside({
  setup,
  trendWeightKg,
  waists,
  sites,
  today,
}: {
  setup: UserSetup;
  trendWeightKg: number;
  waists: readonly WaistObservation[];
  sites: readonly SiteObservation[];
  today: CalendarDate;
}): EstimatedBodyFat {
  const profile = setup.profile;
  const formula = deurenbergBodyFat({
    sex: profile.sex,
    weightKg: trendWeightKg,
    heightCm: profile.heightCm,
    ageYears: profile.ageOn(today),
  });
  const inWindow = (date: CalendarDate) => !date.isAfter(today) && date.daysUntil(today) < BodyFatRule.waistWindowDays;
  const recent = waists.filter((w) => inWindow(w.date));
  if (recent.length < BodyFatRule.minWaistEntries) return { estimate: formula, basis: 'formula', waistEntries: 0 };

  const entryNoiseCm = recent.some((w) => w.isSingleReading) ? WaistRule.singleReadingNoiseCm : WaistRule.medianOfThreeNoiseCm;
  const waistCm = median(recent.map((w) => w.waistCm));
  const waistNoiseCm = entryNoiseCm / Math.sqrt(recent.length);
  const fromWaist = relativeFatMass({ sex: profile.sex, heightCm: profile.heightCm, waistCm, waistNoiseCm });
  const withWaist = combineBodyFatEstimates(formula, fromWaist, BodyFatRule.formulaErrorCorrelation);

  // The Navy tape method (MM-501): men only, on the neck with enough entries of its own. The female
  // equation reads the waist at its narrowest and the hip, while the app's waist is at the navel, with
  // no natural-waist entry (MeasurementSite), so it is not used for a female profile.
  const middleOf = (site: MeasurementSite) => {
    const entries = sites.filter((o) => o.site === site && inWindow(o.date));
    if (entries.length < BodyFatRule.minWaistEntries) return undefined;
    // The site's own noise per entry; the middle of n entries is about a quarter less efficient than their mean.
    const single = entries.some((o) => o.isSingleReading) ? WaistRule.singleReadingFactor : 1;
    const perEntry = MeasurementSite.facts(site).noiseCm * single;
    return { cm: median(entries.map((o) => o.valueCm)), noiseCm: (perEntry * Math.sqrt(1.25)) / Math.sqrt(entries.length) };
  };
  const neck = profile.sex === 'male' ? middleOf('neck') : undefined;
  const fromTape =
    neck === undefined
      ? undefined
      : navyBodyFat({
          sex: profile.sex,
          heightCm: profile.heightCm,
          waistCm,
          neckCm: neck.cm,
          circumferenceNoiseCm: Math.sqrt(waistNoiseCm ** 2 + neck.noiseCm ** 2),
        });
  if (fromTape === undefined) return { estimate: withWaist, basis: 'waist', waistEntries: recent.length };
  return {
    estimate: combineBodyFatEstimates(withWaist, fromTape, BodyFatRule.navyErrorCorrelation),
    basis: 'tape',
    waistEntries: recent.length,
  };
}
