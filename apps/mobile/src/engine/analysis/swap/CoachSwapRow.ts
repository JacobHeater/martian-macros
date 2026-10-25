import type { FoodGroup } from '../../../domain/food/FoodGroup';
import type { CoachSwapMatch } from './CoachSwapMatch';
import type { CoachSwapReplacement } from './CoachSwapReplacement';

/**
 * One row of the coach's swap table (MM-617): which foods it matches, and
 * what goes in their place, tried in order, with typical figures a serving
 * and where they come from.
 */
export interface CoachSwapRow {
  /** The row's name and its evidence row (`coachSwapTable.<key>`). */
  readonly key: string;
  /** Any of these matches the food's name. */
  readonly match: readonly CoachSwapMatch[];
  /** None of these phrases is in the name. */
  readonly unless?: readonly string[] | undefined;
  /** When the food's group is known (MM-616), it is one of these. */
  readonly groups?: readonly FoodGroup[] | undefined;
  /** The replacements, the first that qualifies is offered. */
  readonly replacements: readonly CoachSwapReplacement[];
  /** Where the figures come from. */
  readonly source: string;
}
