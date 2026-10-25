import type { CalendarDate } from '../../../domain/CalendarDate';
import type { CoachAdviceGivenKind } from './CoachAdviceGivenKind';

/**
 * One order about a food the Coach tab showed (MM-617), as the coach's
 * record keeps it: at most one for a food, kind and day. The coach follows
 * up on it ("Tuesday I told you to skip the General Tso's chicken. It's
 * back") and says when it was taken (`coachFollowUpsOf`).
 */
export interface CoachAdviceGiven {
  /** The food's key (`foodKeyOf`: the name, trimmed and in lower case), or a meal logged as one, by its name in lower case. */
  readonly foodKey: string;
  /** The food's name as the order named it. */
  readonly foodName: string;
  readonly kind: CoachAdviceGivenKind;
  /** A swap's replacement, by name (a swap table row's key for a table swap); undefined for any other order. */
  readonly replacementName: string | undefined;
  /** The food's calories a time when the order was given; for `taken`, the calories said to be saved. */
  readonly kcal: number;
  /** The day the order was shown. */
  readonly on: CalendarDate;
}
