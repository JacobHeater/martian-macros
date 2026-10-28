import type { CalendarDate } from '../../domain/CalendarDate';
import type { Caution } from '../../domain/Caution';
import type { FoodEntry } from '../../domain/FoodEntry';
import type { GoalMode } from '../../domain/GoalMode';
import type { Meal } from '../../domain/Meal';
import type { InsightSafeguards } from '../InsightSafeguards';
import { adviceFoodOf } from './food/adviceFoodOf';
import { countsAsFood } from './food/countsAsFood';
import { foodGroupOf } from './food/foodGroupOf';
import { foodLimitsOf } from './food/foodLimitsOf';
import type { MealBreakdownAnalysis } from './MealBreakdownAnalysis';
import { swapFor } from './swap/swapFor';
import type { TradeCatalog } from './TradeCatalog';

const sum = (values: readonly number[]) => values.reduce((s, v) => s + v, 0);

/**
 * Computes the deterministic on-demand `MealBreakdownAnalysis` for `mealEntries`
 * within `dayEntries` against the day's calorie and protein targets (MM-663).
 */
export function mealBreakdownAnalysisOf(input: {
  readonly meal: Meal;
  readonly day: CalendarDate;
  readonly mealEntries: readonly FoodEntry[];
  readonly dayEntries: readonly FoodEntry[];
  readonly dailyKcalTarget: number;
  readonly dailyProteinTargetG: number;
  readonly goal: GoalMode;
  readonly history: readonly FoodEntry[];
  readonly catalog?: TradeCatalog | undefined;
  readonly safeguards: InsightSafeguards;
  readonly cautions?: ReadonlySet<Caution> | undefined;
}): MealBreakdownAnalysis {
  const limits = foodLimitsOf(input.safeguards);
  const mealKcal = sum(input.mealEntries.map((e) => e.kcal));
  const mealProteinG = sum(input.mealEntries.map((e) => e.proteinG));
  const mealCarbsG = sum(input.mealEntries.map((e) => e.carbsG));
  const mealFatG = sum(input.mealEntries.map((e) => e.fatG));

  const dayKcal = sum(input.dayEntries.map((e) => e.kcal));
  const dayProteinG = sum(input.dayEntries.map((e) => e.proteinG));

  const dailyKcalShare = input.dailyKcalTarget > 0 ? mealKcal / input.dailyKcalTarget : 0;
  const dailyProteinShare = input.dailyProteinTargetG > 0 ? mealProteinG / input.dailyProteinTargetG : 0;
  const mealProteinDensity = mealKcal > 0 ? (mealProteinG * 4) / mealKcal : 0;
  const targetProteinDensity = input.dailyKcalTarget > 0 ? (input.dailyProteinTargetG * 4) / input.dailyKcalTarget : 0;

  const kcalRemaining = input.dailyKcalTarget - dayKcal;
  const proteinRemainingG = Math.max(0, input.dailyProteinTargetG - dayProteinG);
  const minKcalForProtein = proteinRemainingG * 4;
  const requiredRestOfDayDensity = kcalRemaining > 0 ? minKcalForProtein / kcalRemaining : proteinRemainingG > 0 ? 1 : 0;
  const proteinUnrecoverable = !limits.proteinOnly && !limits.noMoreProtein && kcalRemaining >= 0 && proteinRemainingG > 0 && minKcalForProtein > kcalRemaining;

  const countable = input.mealEntries.filter((e) => countsAsFood(e) && e.kcal > 0);
  const densityOf = (e: FoodEntry) => (e.kcal > 0 ? (e.proteinG * 4) / e.kcal : 0);
  const unbackedOf = (e: FoodEntry) => e.kcal - (targetProteinDensity > 0 ? (e.proteinG * 4) / targetProteinDensity : 0);

  // Rank by lowest protein density and highest unbacked calorie displacement.
  const sorted = [...countable].sort((a, b) => unbackedOf(b) - unbackedOf(a) || densityOf(a) - densityOf(b));
  const worst = !limits.proteinOnly ? sorted[0] : undefined;

  let outlierItem: MealBreakdownAnalysis['outlierItem'];
  let suggestedSwap: MealBreakdownAnalysis['suggestedSwap'];

  if (worst !== undefined) {
    outlierItem = {
      name: worst.name.trim(),
      kcal: worst.kcal,
      proteinG: worst.proteinG,
      fatG: worst.fatG,
      proteinDensity: densityOf(worst),
    };
    const adviceFood = adviceFoodOf(worst.name, [worst]);
    const swap = swapFor({
      food: { ...adviceFood, carbsG: worst.carbsG },
      group: foodGroupOf([worst], input.catalog),
      meal: input.meal,
      goal: input.goal,
      history: input.history,
      catalog: input.catalog,
      safeguards: input.safeguards,
      cautions: input.cautions ?? input.safeguards.cautions,
    });
    if (swap !== undefined) {
      suggestedSwap = {
        originalName: worst.name.trim(),
        replacementName: swap.name,
        replacementKcal: swap.kcal,
        replacementProteinG: swap.proteinG,
        caloriesSaved: Math.max(0, worst.kcal - (swap.kcal ?? worst.kcal)),
        proteinGained: Math.max(0, (swap.proteinG ?? worst.proteinG) - worst.proteinG),
      };
    }
  }

  return {
    meal: input.meal,
    day: input.day,
    protectedPath: limits.proteinOnly,
    mealKcal,
    mealProteinG,
    mealCarbsG,
    mealFatG,
    dailyKcalShare,
    dailyProteinShare,
    mealProteinDensity,
    targetProteinDensity,
    kcalRemaining,
    proteinRemainingG,
    requiredRestOfDayDensity,
    proteinUnrecoverable,
    ...(outlierItem === undefined ? {} : { outlierItem }),
    ...(suggestedSwap === undefined ? {} : { suggestedSwap }),
  };
}
