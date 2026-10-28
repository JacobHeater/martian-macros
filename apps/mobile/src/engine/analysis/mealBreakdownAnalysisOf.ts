import { CalendarDate } from '../../domain/CalendarDate';
import type { Caution } from '../../domain/Caution';
import type { FoodEntry } from '../../domain/FoodEntry';
import type { GoalMode } from '../../domain/GoalMode';
import type { Meal } from '../../domain/Meal';
import type { InsightSafeguards } from '../InsightSafeguards';
import { adviceFoodOf } from './food/adviceFoodOf';
import { countsAsFood } from './food/countsAsFood';
import { foodGroupOf } from './food/foodGroupOf';
import { foodKeyOf } from './food/foodKeyOf';
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
  readonly day?: CalendarDate | undefined;
  readonly mealEntries: readonly FoodEntry[];
  readonly dayEntries: readonly FoodEntry[];
  readonly dailyKcalTarget?: number | undefined;
  readonly kcalTarget?: number | undefined;
  readonly dailyProteinTargetG?: number | undefined;
  readonly proteinTargetG?: number | undefined;
  readonly goal?: GoalMode | undefined;
  readonly history?: readonly FoodEntry[] | undefined;
  readonly candidates?: readonly FoodEntry[] | undefined;
  readonly catalog?: TradeCatalog | undefined;
  readonly safeguards?: InsightSafeguards | undefined;
  readonly protectedPath?: boolean | undefined;
  readonly cautions?: ReadonlySet<Caution> | undefined;
}): MealBreakdownAnalysis {
  const defaultSafeguards: InsightSafeguards = {
    adult: true,
    eatingDisorderHistory: input.protectedPath === true,
    weightHidden: false,
    paused: false,
    underEating: false,
    cautions: input.protectedPath === true ? new Set<Caution>(['eatingDisorderHistory']) : new Set<Caution>(),
  };
  const safeguards = input.safeguards ?? defaultSafeguards;
  const limits = foodLimitsOf(safeguards);
  const protectedPath = input.protectedPath ?? limits.proteinOnly;
  const day = input.day ?? input.mealEntries[0]?.date ?? input.dayEntries[0]?.date ?? CalendarDate.of(2026, 10, 5);
  const dailyKcalTarget = input.dailyKcalTarget ?? input.kcalTarget ?? 0;
  const dailyProteinTargetG = input.dailyProteinTargetG ?? input.proteinTargetG ?? 0;
  const goal: GoalMode = input.goal ?? 'fatLoss';
  const rawHistory = input.history ?? input.candidates ?? [];

  const mealKcal = sum(input.mealEntries.map((e) => e.kcal));
  const mealProteinG = sum(input.mealEntries.map((e) => e.proteinG));
  const mealCarbsG = sum(input.mealEntries.map((e) => e.carbsG));
  const mealFatG = sum(input.mealEntries.map((e) => e.fatG));

  const dayKcal = sum(input.dayEntries.map((e) => e.kcal));
  const dayProteinG = sum(input.dayEntries.map((e) => e.proteinG));

  const dailyKcalShare = dailyKcalTarget > 0 ? mealKcal / dailyKcalTarget : 0;
  const dailyProteinShare = dailyProteinTargetG > 0 ? mealProteinG / dailyProteinTargetG : 0;
  const mealProteinDensity = mealKcal > 0 ? (mealProteinG * 4) / mealKcal : 0;
  const targetProteinDensity = dailyKcalTarget > 0 ? (dailyProteinTargetG * 4) / dailyKcalTarget : 0;

  const kcalRemaining = dailyKcalTarget - dayKcal;
  const proteinRemainingG = Math.max(0, dailyProteinTargetG - dayProteinG);
  const minKcalForProtein = proteinRemainingG * 4;
  const requiredRestOfDayDensity = kcalRemaining > 0 ? minKcalForProtein / kcalRemaining : proteinRemainingG > 0 ? 1 : 0;
  const proteinUnrecoverable =
    !protectedPath && !limits.noMoreProtein && kcalRemaining >= 0 && proteinRemainingG > 0 && minKcalForProtein > kcalRemaining;

  const countable = input.mealEntries.filter((e) => countsAsFood(e) && e.kcal > 0);
  const densityOf = (e: FoodEntry) => (e.kcal > 0 ? (e.proteinG * 4) / e.kcal : 0);
  const unbackedOf = (e: FoodEntry) => e.kcal - (targetProteinDensity > 0 ? (e.proteinG * 4) / targetProteinDensity : 0);

  // Rank by lowest protein density and highest unbacked calorie displacement.
  const sorted = [...countable].sort((a, b) => unbackedOf(b) - unbackedOf(a) || densityOf(a) - densityOf(b));
  const worst = !protectedPath ? sorted[0] : undefined;

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
    const history = rawHistory.includes(worst) ? rawHistory : [...rawHistory, worst];
    const swap = swapFor({
      food: { ...adviceFood, carbsG: worst.carbsG },
      group: foodGroupOf(foodKeyOf(worst), [worst], input.catalog),
      meal: input.meal,
      goal,
      history,
      catalog: input.catalog,
      safeguards,
      cautions: input.cautions ?? safeguards.cautions,
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

  const analysisHash = [
    day.toString(),
    input.meal,
    protectedPath ? 'protected' : 'full',
    Math.round(mealKcal),
    Math.round(mealProteinG),
    Math.round(kcalRemaining),
    Math.round(proteinRemainingG),
    outlierItem?.name ?? '',
    suggestedSwap?.replacementName ?? '',
  ].join(':');

  return {
    meal: input.meal,
    day,
    protectedPath,
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
    analysisHash,
    ...(outlierItem === undefined ? {} : { outlierItem }),
    ...(suggestedSwap === undefined ? {} : { suggestedSwap }),
  };
}
