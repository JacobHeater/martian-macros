import type { CoachFinding } from './CoachFinding';
import type { CoachVerdict } from './CoachVerdict';

/**
 * The headline's facts (MM-617): the biggest problem and its cause, or with
 * no problem the biggest strength. Problems come before strengths.
 *
 * 1. 1d over the band around its target: `over`, from the closing line
 *    (`backToPlan`), which carries the calories over and the meal that did
 *    it. Under a safeguard that forbids calorie lines it carries neither,
 *    and this is skipped.
 * 2. Else the top fix, as ranked (`arrangeCoachFindings`), with its cause.
 * 3. Else the top holding-up finding.
 */
export function coachVerdictOf({
  fixes,
  holdingUp,
  close,
}: {
  /** The fixes in the order they are shown. */
  fixes: readonly CoachFinding[];
  holdingUp: readonly CoachFinding[];
  /** 1d's closing line, when the day is over its target. */
  close: CoachFinding | undefined;
}): CoachVerdict | undefined {
  const overKcal = close?.figures['overKcal'];
  if (close !== undefined && overKcal !== undefined && close.figures['overBand'] === 1) {
    return { kind: 'over', finding: close, overKcal, targetKcal: close.figures['targetKcal'], cause: close.cause };
  }
  const fix = fixes[0];
  if (fix !== undefined) return { kind: 'fix', finding: fix, cause: fix.cause };
  const strength = holdingUp[0];
  return strength === undefined ? undefined : { kind: 'holdingUp', finding: strength };
}
