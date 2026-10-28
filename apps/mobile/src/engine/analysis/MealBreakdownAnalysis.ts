import type { CalendarDate } from '../../domain/CalendarDate';
import type { Meal } from '../../domain/Meal';

/**
 * Deterministic meal-level breakdown for the Food tab's on-demand
 * "Coach breakdown" sheet (MM-663, MM-666).
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
  /** Deterministic higher-efficiency substitution for `outlierItem`, when one qualifies. */
  readonly suggestedSwap?:
    | {
        readonly originalName: string;
        readonly replacementName: string;
        readonly replacementKcal?: number | undefined;
        readonly replacementProteinG?: number | undefined;
        readonly caloriesSaved: number;
        readonly proteinGained: number;
      }
    | undefined;
}
