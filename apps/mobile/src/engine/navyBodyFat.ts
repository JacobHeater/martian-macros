import type { BiologicalSex } from '../domain/BiologicalSex';
import { clamp } from '../lang/clamp';
import { BodyFatEstimate } from './BodyFatEstimate';
import { BodyFatRule } from './BodyFatRule';

/**
 * The US Navy circumference method (Hodgdon and Beckett 1984), in
 * centimetres (MM-501):
 * - men: 495 / (1.0324 - 0.19077 log10(waist - neck) + 0.15456 log10(height)) - 450;
 * - women: 495 / (1.29579 - 0.35004 log10(waist + hip - neck) + 0.22100 log10(height)) - 450.
 *
 * The uncertainty is the method's own error against a body scan,
 * `BodyFatRule.navySigmaPercent`, together with the tape's noise on the
 * circumferences, `circumferenceNoiseCm`, carried through the formula.
 * Undefined when the measurements cannot be read (the neck at or above the
 * rest), which is a mistyped entry rather than a body.
 */
export function navyBodyFat({
  sex,
  heightCm,
  waistCm,
  neckCm,
  hipCm,
  circumferenceNoiseCm,
}: {
  sex: BiologicalSex;
  heightCm: number;
  waistCm: number;
  neckCm: number;
  /** Needed for a female profile. */
  hipCm?: number | undefined;
  circumferenceNoiseCm: number;
}): BodyFatEstimate | undefined {
  const female = sex === 'female';
  if (female && hipCm === undefined) return undefined;
  const girth = female ? waistCm + (hipCm ?? 0) - neckCm : waistCm - neckCm;
  if (!(girth > 1) || !(heightCm > 0)) return undefined;
  const at = (g: number) =>
    female
      ? 495 / (1.29579 - 0.35004 * Math.log10(g) + 0.221 * Math.log10(heightCm)) - 450
      : 495 / (1.0324 - 0.19077 * Math.log10(g) + 0.15456 * Math.log10(heightCm)) - 450;
  const percent = at(girth);
  if (!Number.isFinite(percent)) return undefined;
  // How many points one centimetre of girth moves the figure.
  const pointsPerCm = Math.abs(at(girth + 0.5) - at(girth - 0.5));
  const method = BodyFatRule.navySigmaPercent;
  const tape = pointsPerCm * circumferenceNoiseCm;
  return new BodyFatEstimate({ percent: clamp(percent, 3, 60), sigmaPercent: Math.sqrt(method * method + tape * tape) });
}
