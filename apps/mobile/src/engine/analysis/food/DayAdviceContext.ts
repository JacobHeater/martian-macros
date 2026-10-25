import type { CoachAdviceReplacement } from '../CoachAdviceReplacement';
import type { CoachFood } from '../CoachFood';
import type { DayUnit } from './DayUnit';
import type { FoodLimits } from './FoodLimits';
import type { MealBreakdown } from './MealBreakdown';

/** What 1d's orders are worked out from (MM-617), once for the day (`analyseFoodDay`). */
export interface DayAdviceContext {
  readonly limits: FoodLimits;
  /** The day's meals and foods as the orders name them (`dayUnitsOf`). */
  readonly units: readonly DayUnit[];
  /** The meal breakdown, when the day is over the band around its target. */
  readonly breakdown: MealBreakdown | undefined;
  /** Today's calories less today's target; positive is over. */
  readonly overKcal: number;
  /** The protein per 100 kcal the targets need. */
  readonly requiredPer100Kcal: number;
  /** The flat calorie target, to go back to tomorrow. */
  readonly targetKcal: number;
  readonly kcalLeft: number;
  readonly proteinLeftG: number;
  /** The foods the person logs that fit what is left (`foodsThatFit`). */
  readonly fits: readonly CoachFood[];
  /** Any of today's foods was sauced (`sauced`). */
  readonly sauced: boolean;
  readonly dinnerLogged: boolean;
  /** What goes in a unit's place (`swapFor`), or undefined. */
  readonly swap: (unit: DayUnit) => CoachAdviceReplacement | undefined;
}
