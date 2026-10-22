import type { BiologicalSex } from '../domain/BiologicalSex';
import type { GoalMode } from '../domain/GoalMode';
import { calibrationDays } from '../engine/coachConstants';
import { MaintenanceRule } from '../engine/MaintenanceRule';
import { WeightTrendModel } from '../engine/WeightTrendModel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import type { Fmt } from './Fmt';

/**
 * What the first month will look like (MM-158), in at most five short
 * points chosen by goal, every figure the person's own: the aim as a range
 * from their pace and weight (labelled as the aim), the day-to-day noise
 * from the trend model's water spread for their weight, the two weeks of
 * calibration, and what else moves the scale. Nothing here states an
 * amount of fat or muscle by a date (MM-96).
 */
export function whatToExpectPoints({
  goal,
  paceFraction,
  weightKg,
  sex,
  menstruates,
  fmt,
}: {
  goal: GoalMode;
  /** The chosen fat-loss pace, or the gain pace, as a share of body weight a week; 0 at maintenance. */
  paceFraction: number;
  weightKg: number;
  sex: BiologicalSex;
  /** A female profile that has not said she does not menstruate (MM-20). */
  menstruates?: boolean;
  fmt: Fmt;
}): string[] {
  const unit = fmt.weightUnit;
  const inUnit = (kg: number) => fmt.weightFromKg(kg);
  const oneDecimal = (kg: number) => toStringAsFixed(inUnit(kg), 1);
  const whole = (kg: number) => roundHalfAwayFromZero(inUnit(kg)) + 0;
  const weekly = Math.abs(paceFraction) * weightKg;
  // With the weight hidden (MM-118) the aim is a share of body weight and the noise is said without a figure.
  const aim = fmt.weightHidden
    ? `about ${toStringAsFixed(Math.abs(paceFraction) * 100, 2)}% of your body weight a week`
    : `about ${oneDecimal(weekly * (2 / 3))} to ${oneDecimal(weekly * (4 / 3))} ${unit} a week`;
  const sigma = new WeightTrendModel().relativeWaterSigma * weightKg;
  const noise = fmt.weightHidden
    ? 'Day to day, the scale moves for reasons that are not fat. The trend is what counts, and the coach reads it for you.'
    : `Day to day, the scale will move by ${Math.max(1, whole(sigma))} to ${Math.max(2, whole(2 * sigma))} ${unit} for reasons that are not fat. The trend line is what counts.`;
  const calibration = `For ${calibrationDays} days your targets stay put while the coach learns your expenditure. The first change comes around day ${calibrationDays + 1} and will be small.`;
  const creatine = 'If you take creatine, or start it later, tell the app. It moves the scale.';
  const points: string[] = [];
  switch (goal) {
    case 'fatLoss':
      points.push(
        `Your plan aims for ${aim}.`,
        'The first week often shows more. That extra is water, and it does not keep coming.',
        noise,
        calibration,
        creatine,
      );
      break;
    case 'leanGain':
      points.push(
        `Your plan aims for ${aim}, up.`,
        'The first week often shows more. That extra is water and food, not muscle.',
        'Gaining faster than the aim adds fat, not muscle; the coach keeps the surplus small.',
        noise,
        calibration,
      );
      break;
    case 'recomp':
      points.push(
        'The scale is meant to stay roughly flat: a small deficit while you train.',
        'What to watch is your waist and your strength, not your weight.',
        'An honest review of whether it is working comes at eight weeks.',
        'Recomp works well for people newer to lifting or returning after time off, with body fat to spare.',
        calibration,
      );
      break;
    case 'maintenance':
      points.push(
        `Maintaining means holding your trend within ${toStringAsFixed(MaintenanceRule.bandFraction * 100, 1)}% of your anchor weight, read two weeks in.`,
        'Weight wandering inside that band is normal, and targets do not chase it.',
        noise,
        calibration,
      );
      break;
  }
  if (sex === 'female' && menstruates === true) {
    points.push('Weight commonly rises for a few days around your period. Marking period days lets the trend expect it.');
  }
  return points;
}
