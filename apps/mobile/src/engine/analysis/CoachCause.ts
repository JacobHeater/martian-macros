import type { CalendarDate } from '../../domain/CalendarDate';
import type { Meal } from '../../domain/Meal';
import type { CoachAdviceFood } from './CoachAdviceFood';

/**
 * What drove a finding (MM-617), as data for the headline and the lead of
 * the fix: on 1d, the meal of the day that gave the most calories, the meal
 * logged as one inside it, and its worst food ("Lunch was the problem. The
 * Chinese buffet: 2,368 kcal … General Tso's chicken was the worst of
 * it"); on a span, the top food, or the meal of the one day that drove it.
 */
export interface CoachCause {
  /** The meal slot. */
  readonly meal?: Meal | undefined;
  /** The meal logged as one (MM-587) that made up most of the slot, by name; undefined when the slot was separate foods. */
  readonly mealName?: string | undefined;
  /** The calories of that meal (the logged meal's, or the slot's). */
  readonly mealKcal?: number | undefined;
  /** How many foods the meal was. */
  readonly mealFoods?: number | undefined;
  /** The worst food: of the meal, or the top food of a span. */
  readonly food?: CoachAdviceFood | undefined;
  /** On a span: the day it was eaten, when one day drove the span. */
  readonly on?: CalendarDate | undefined;
}
