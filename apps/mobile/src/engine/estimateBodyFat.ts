import type { CalendarDate } from '../domain/CalendarDate';
import type { UserSetup } from '../domain/UserSetup';
import type { WaistObservation } from '../domain/WaistObservation';
import { BodyFatEstimate } from './BodyFatEstimate';
import { BodyFatRule } from './BodyFatRule';
import { combineBodyFatEstimates } from './combineBodyFatEstimates';
import { deurenbergBodyFat } from './deurenbergBodyFat';
import type { EstimatedBodyFat } from './EstimatedBodyFat';
import { relativeFatMass } from './relativeFatMass';
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
 * their middle value. Pure: the same stored measurements give the same
 * range.
 */
export function estimateBodyFat({
  setup,
  trendWeightKg,
  waists,
  today,
}: {
  setup: UserSetup;
  trendWeightKg: number;
  waists: readonly WaistObservation[];
  today: CalendarDate;
}): EstimatedBodyFat {
  const profile = setup.profile;
  const given = setup.bodyFatPercent;
  if (given !== undefined) {
    return { estimate: new BodyFatEstimate({ percent: given, sigmaPercent: 4 }), basis: 'yourFigure', waistEntries: 0 };
  }

  const formula = deurenbergBodyFat({
    sex: profile.sex,
    weightKg: trendWeightKg,
    heightCm: profile.heightCm,
    ageYears: profile.ageOn(today),
  });
  const recent = waists.filter((w) => !w.date.isAfter(today) && w.date.daysUntil(today) < BodyFatRule.waistWindowDays);
  if (recent.length < BodyFatRule.minWaistEntries) return { estimate: formula, basis: 'formula', waistEntries: 0 };

  const entryNoiseCm = recent.some((w) => w.isSingleReading) ? WaistRule.singleReadingNoiseCm : WaistRule.medianOfThreeNoiseCm;
  const fromWaist = relativeFatMass({
    sex: profile.sex,
    heightCm: profile.heightCm,
    waistCm: median(recent.map((w) => w.waistCm)),
    waistNoiseCm: entryNoiseCm / Math.sqrt(recent.length),
  });
  return {
    estimate: combineBodyFatEstimates(formula, fromWaist, BodyFatRule.formulaErrorCorrelation),
    basis: 'waist',
    waistEntries: recent.length,
  };
}
