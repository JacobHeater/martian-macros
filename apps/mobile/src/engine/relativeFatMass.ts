import type { BiologicalSex } from '../domain/BiologicalSex';
import { clamp } from '../lang/clamp';
import { BodyFatEstimate } from './BodyFatEstimate';
import { BodyFatRule } from './BodyFatRule';

/**
 * Relative fat mass (Woolcott and Bergman 2018): body fat from height and
 * waist, 64 - 20 x height / waist for men, 76 - 20 x height / waist for
 * women (MM-34).
 *
 * The uncertainty is the formula's own error together with the waist's
 * noise, `waistNoiseCm`, carried through the formula. The formula's error
 * dominates: more tape entries narrow the range only a little.
 */
export function relativeFatMass({
  sex,
  heightCm,
  waistCm,
  waistNoiseCm,
}: {
  sex: BiologicalSex;
  heightCm: number;
  waistCm: number;
  waistNoiseCm: number;
}): BodyFatEstimate {
  const percent = (sex === 'female' ? 76 : 64) - (20 * heightCm) / waistCm;
  // How many points one centimetre of waist moves the figure.
  const pointsPerCm = (20 * heightCm) / (waistCm * waistCm);
  const formula = BodyFatRule.waistFormulaSigmaPercent;
  const tape = pointsPerCm * waistNoiseCm;
  return new BodyFatEstimate({ percent: clamp(percent, 3, 60), sigmaPercent: Math.sqrt(formula * formula + tape * tape) });
}
