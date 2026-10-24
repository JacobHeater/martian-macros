import type { CalendarDate } from '../../CalendarDate';
import type { MealPortionEaten } from './MealPortionEaten';

/**
 * What the person tells the app about a meal before it goes to their
 * assistant (MM-599): the questions the prompt used to have the assistant
 * ask. Nothing else about the person is in it.
 */
export interface MealQuestionAnswers {
  /** The meal's name, as it is to be logged. */
  readonly name: string;
  readonly eaten: MealPortionEaten;
  /** Anything shown that was not eaten ("the fries"); empty when nothing. */
  readonly notEaten: string;
  /** The brand or restaurant it came from; empty when none. */
  readonly from: string;
  /** Anything else the person wants their assistant to know about the meal (MM-602); empty when nothing. */
  readonly notes: string;
  /** The day it was eaten, and the minute of that day when one is given. */
  readonly day: CalendarDate;
  readonly eatenAt: number | undefined;
  /** Whether the photos go with the prompt, or follow it in the chat. */
  readonly photosAttached: boolean;
}
