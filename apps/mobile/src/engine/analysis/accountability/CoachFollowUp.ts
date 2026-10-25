import type { CalendarDate } from '../../../domain/CalendarDate';
import type { Meal } from '../../../domain/Meal';
import type { CoachAdvice } from '../CoachAdvice';
import type { CoachAdviceFood } from '../CoachAdviceFood';
import type { CoachFollowUpKind } from './CoachFollowUpKind';

/**
 * A follow-up on what the coach said or on what keeps happening (MM-617's
 * accountability), as data in the style of `CoachAdvice`: the words are in
 * `format/`. It rides on the finding about the same food or meal
 * (`CoachFinding.followUps`), or is a finding of its own (signals
 * `saidBefore`, `repeatOver`, `adviceTaken`).
 *
 * - `saidBefore`: "Tuesday I told you to skip the General Tso's chicken.
 *   It's back: 744 kcal again." `food` at today's portion, `order`,
 *   `givenOn` (by weekday when `byWeekday`, else the date), `givenKcal`.
 * - `repeatOver`: "Third day this week over by 500 or more." `days` (today
 *   among them), `overByKcal`, and what drove them: the worst `food` of
 *   those days, or the `meal`, on `drivenDays` of them.
 * - `repeatFat`, `repeatProteinShort`: `days` of the last `ofDays`.
 * - `adviceTaken`: "You skipped the biscuit three days running. That's
 *   1,400 kcal you didn't eat." `food` at its usual calories, `order`,
 *   `givenOn`, `days` running without it, `beforeDays` of the `ofDays`
 *   before the advice it was eaten on, and `savedKcal`.
 */
export interface CoachFollowUp {
  readonly kind: CoachFollowUpKind;
  /** The food it is about: today's portion (`saidBefore`), its usual a day (`adviceTaken`), or the worst food that drove the repeats. */
  readonly food?: CoachAdviceFood | undefined;
  /** The order it follows up on: `skip` or `swap` (`saidBefore`), `skip` (`adviceTaken`). */
  readonly order?: CoachAdvice['kind'] | undefined;
  /** `adviceTaken` of an add: what the add was for. */
  readonly nutrient?: CoachAdvice['nutrient'] | undefined;
  /** The swap's replacement, by name, when the order was a swap. */
  readonly replacementName?: string | undefined;
  /** The day the order was given. */
  readonly givenOn?: CalendarDate | undefined;
  /** `saidBefore`: name the day it was given by its weekday ("Tuesday"), within `CoachFollowUpRule.weekdayWithinDays`; else by its date. */
  readonly byWeekday?: boolean | undefined;
  /** `saidBefore`: the food's calories a time when the order was given. */
  readonly givenKcal?: number | undefined;
  /** Repeats: how many days (3 is "third day"). `adviceTaken`: the days running it was not eaten. */
  readonly days?: number | undefined;
  /** `repeatFat`, `repeatProteinShort`: of how many days. `adviceTaken`: the days before the advice its old rate is read over. */
  readonly ofDays?: number | undefined;
  /** `repeatOver`: the calories over target that count a day (500). */
  readonly overByKcal?: number | undefined;
  /** `repeatOver`: the meal that gave the most calories on most of the days, when no one food did. */
  readonly meal?: Meal | undefined;
  /** `repeatOver`: on how many of the days the food or meal named drove it. */
  readonly drivenDays?: number | undefined;
  /** `adviceTaken`: the days it was eaten on in the `ofDays` before the advice. */
  readonly beforeDays?: number | undefined;
  /** `adviceTaken`: its usual calories a day times the days it would have been eaten at its old rate (rounded to whole days). */
  readonly savedKcal?: number | undefined;
}
