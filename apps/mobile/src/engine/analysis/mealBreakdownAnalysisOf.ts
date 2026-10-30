import { CalendarDate } from '../../domain/CalendarDate';
import type { Caution } from '../../domain/Caution';
import type { FoodEntry } from '../../domain/FoodEntry';
import type { GoalMode } from '../../domain/GoalMode';
import type { Meal } from '../../domain/Meal';
import type { InsightSafeguards } from '../InsightSafeguards';
import { foodLimitsOf } from './food/foodLimitsOf';
import type { MealBreakdownAnalysis } from './MealBreakdownAnalysis';
import type { MealVerdict } from './MealVerdict';
import { mealMovesOf } from './moves/mealMovesOf';
import type { TradeCatalog } from './TradeCatalog';

const sum = (values: readonly number[]) => values.reduce((s, v) => s + v, 0);

/**
 * Computes the deterministic on-demand `MealBreakdownAnalysis` for `mealEntries`
 * within `dayEntries` against the day's calorie and protein targets (MM-663),
 * with the meal's moves and the one the coach orders (`mealMovesOf`, MM-684).
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
  readonly snoozed?: ReadonlySet<string> | undefined;
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
  const history = input.history ?? input.candidates ?? [];

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

  const moves = protectedPath
    ? { outlier: undefined, moves: [], best: undefined }
    : mealMovesOf({
        meal: input.meal,
        mealEntries: input.mealEntries,
        dayEntries: input.dayEntries,
        dailyKcalTarget,
        dailyProteinTargetG,
        goal,
        history,
        catalog: input.catalog,
        safeguards,
        cautions: input.cautions ?? safeguards.cautions,
        snoozed: input.snoozed,
      });
  const outlier = moves.outlier;
  const outlierItem =
    outlier === undefined
      ? undefined
      : { name: outlier.name, kcal: outlier.kcal, proteinG: outlier.proteinG, fatG: outlier.fatG ?? 0, proteinDensity: outlier.proteinDensity };
  const best = moves.best;
  // The verdict (MM-711): a drag in the meal; else the day's order (a move, or the day over with protein covered); else fine.
  const verdict: MealVerdict = outlierItem !== undefined ? 'drag' : best !== undefined || kcalRemaining < 0 ? 'order' : 'fine';
  const bestName = best === undefined ? '' : best.kind === 'nextMeal' ? (best.food?.name ?? '') : best.kind === 'addProtein' ? best.added.name : best.kind === 'swapSameGroup' ? best.replacement.name : '';

  const analysisHash = [
    day.toString(),
    input.meal,
    protectedPath ? 'protected' : 'full',
    Math.round(mealKcal),
    Math.round(mealProteinG),
    Math.round(kcalRemaining),
    Math.round(proteinRemainingG),
    outlierItem?.name ?? '',
    best?.kind ?? '',
    bestName,
    verdict,
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
    moves,
    verdict,
  };
}
