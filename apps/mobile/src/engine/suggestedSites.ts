import type { BiologicalSex } from '../domain/BiologicalSex';
import type { GoalMode } from '../domain/GoalMode';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';

/**
 * The sites beyond the waist offered once, by goal and sex (MM-156): hips
 * for a female profile; upper arm and thigh in a lean gain or recomp.
 * Neck (and hips, for a female profile) are what a tape body-fat estimate
 * needs (MM-34, MM-501), offered with `tapeBodyFat`. Nothing is suggested
 * with an eating-disorder history; any site can still be added by hand.
 * Sites already measured are left out; in the session's fixed order.
 */
export function suggestedSites({
  sex,
  goal,
  eatingDisorderHistory,
  measured,
  tapeBodyFat = false,
}: {
  sex: BiologicalSex;
  goal: GoalMode;
  eatingDisorderHistory: boolean;
  measured: ReadonlySet<MeasurementSite>;
  tapeBodyFat?: boolean;
}): MeasurementSite[] {
  if (eatingDisorderHistory) return [];
  const wanted = new Set<MeasurementSite>();
  if (sex === 'female') wanted.add('hips');
  if (goal === 'leanGain' || goal === 'recomp') {
    wanted.add('upperArm');
    wanted.add('thigh');
  }
  if (tapeBodyFat) {
    wanted.add('neck');
    if (sex === 'female') wanted.add('hips');
  }
  return MeasurementSite.optional.filter((site) => wanted.has(site) && !measured.has(site));
}
