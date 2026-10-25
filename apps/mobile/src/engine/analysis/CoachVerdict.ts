import type { CoachCause } from './CoachCause';
import type { CoachFinding } from './CoachFinding';

/**
 * The headline's facts (MM-617): the day's or the span's verdict about the
 * biggest thing, as data; the words are in `format/`.
 *
 * - `over`: 1d over its calorie target, by `overKcal`, and what did it
 *   ("1,054 kcal over. The buffet did it.").
 * - `fix`: the top fix and its cause.
 * - `holdingUp`: no fix; the biggest strength ("Protein 155 g. Minimum hit.").
 */
export interface CoachVerdict {
  readonly kind: 'over' | 'fix' | 'holdingUp';
  /** The finding the verdict leads: 1d's closing line for `over`, else the fix or the strength. */
  readonly finding: CoachFinding;
  /** `over`: calories over the target. */
  readonly overKcal?: number | undefined;
  /** `over`: the day's calorie target. */
  readonly targetKcal?: number | undefined;
  readonly cause?: CoachCause | undefined;
}
