import type { CoachFinding } from './CoachFinding';
import type { CoachVerdict } from './CoachVerdict';
import type { HiddenFinding } from './HiddenFinding';

/**
 * The findings of one span placed in "What your data says" (MM-610), in
 * the order they are shown. Nothing true is left out: what is not in a
 * list of three is in `more`, and a dismissed finding is in `hidden`.
 */
export interface CoachFindingSections {
  /** 1d's "what is left today" (MM-612), shown at the top. */
  readonly left: CoachFinding | undefined;
  /** The top holding-up finding and the top fix, said together; only when both exist. */
  readonly headline: { readonly holdingUp: CoachFinding; readonly fix: CoachFinding } | undefined;
  /** Up to 3: a data-quality finding that limits the rest first, then the fixes by rank. */
  readonly worthChanging: readonly CoachFinding[];
  /** Up to 3, never padded. */
  readonly holdingUp: readonly CoachFinding[];
  /** Every other finding, folded under "N more from your data". */
  readonly more: readonly CoachFinding[];
  /** The findings dismissed in the last 28 days, the first to show again first. */
  readonly hidden: readonly HiddenFinding[];
  /** 1d's closing line on a day over target (MM-617's back to plan), said last; never hidden. */
  readonly close?: CoachFinding | undefined;
  /** The headline's facts (MM-617): the biggest problem and its cause, or the biggest strength. */
  readonly verdict?: CoachVerdict | undefined;
}
