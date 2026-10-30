import type { CalendarDate } from '../../domain/CalendarDate';
import type { Meal } from '../../domain/Meal';
import type { MealVerdict } from './MealVerdict';
import type { MealMoves } from './moves/MealMoves';

/**
 * Deterministic meal-level breakdown for the Food tab's on-demand
 * "Coach breakdown" sheet (MM-663, MM-666), with the meal's moves and the
 * one the coach orders (MM-684).
 */
export interface MealBreakdownAnalysis {
  readonly meal: Meal;
  readonly day: CalendarDate;
  readonly protectedPath: boolean;
  readonly mealKcal: number;
  readonly mealProteinG: number;
  readonly mealCarbsG: number;
  readonly mealFatG: number;
  /** Fraction (0–1+) of the daily calorie target used by this meal. */
  readonly dailyKcalShare: number;
  /** Fraction (0–1+) of the daily protein target achieved by this meal. */
  readonly dailyProteinShare: number;
  /** Meal protein density: `(mealProteinG * 4) / mealKcal`. */
  readonly mealProteinDensity: number;
  /** Target daily protein density: `(dailyProteinTargetG * 4) / dailyKcalTarget`. */
  readonly targetProteinDensity: number;
  readonly kcalRemaining: number;
  readonly proteinRemainingG: number;
  /** Required protein density (`(proteinRemainingG * 4) / kcalRemaining`) across remaining meals today. */
  readonly requiredRestOfDayDensity: number;
  /** True when `proteinRemainingG * 4 > kcalRemaining` (and `kcalRemaining >= 0`). */
  readonly proteinUnrecoverable: boolean;
  /** Stable cache hash of the meal breakdown inputs and the move. */
  readonly analysisHash: string;
  /** The single item in the meal contributing the most unbacked calories for the least protein. */
  readonly outlierItem?:
    | {
        readonly name: string;
        readonly kcal: number;
        readonly proteinG: number;
        readonly fatG: number;
        readonly proteinDensity: number;
      }
    | undefined;
  /** The meal's moves, ranked by the day's gap, and the one ordered (MM-684). */
  readonly moves: MealMoves;
  /** What the coach makes of the meal (MM-711): fine, a drag in it, or the day's order with the meal itself fine. */
  readonly verdict: MealVerdict;
}
