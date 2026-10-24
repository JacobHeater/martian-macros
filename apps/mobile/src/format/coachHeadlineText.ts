import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { findingSubjectText } from './findingSubjectText';

/**
 * MM-610's headline: the top strength and the top fix in one sentence, by
 * their subjects, so it does not repeat the first title under it
 * ("Calories are holding up; fat is worth changing."). About the food or
 * the habit, never the person, and no verdict.
 */
export function coachHeadlineText({ holdingUp, fix }: { holdingUp: CoachFinding; fix: CoachFinding }): string {
  return `${findingSubjectText(holdingUp.signal)} holding up; ${findingSubjectText(fix.signal, { following: true })} worth changing.`;
}
