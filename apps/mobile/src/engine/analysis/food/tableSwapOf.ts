import type { FoodGroup } from '../../../domain/food/FoodGroup';
import type { CoachAdviceFood } from '../CoachAdviceFood';
import type { CoachAdviceReplacement } from '../CoachAdviceReplacement';
import { CoachAdviceRule } from '../CoachAdviceRule';
import type { CoachSwapFigures } from '../swap/CoachSwapFigures';
import type { CoachSwapReplacement } from '../swap/CoachSwapReplacement';
import { coachSwapOf } from '../swap/coachSwapOf';
import { swapAllowed } from '../swap/swapAllowed';
import type { SwapLimits } from '../swap/SwapLimits';
import { SwapRule } from '../swap/SwapRule';
import { TradeRule } from '../TradeRule';

const R = CoachAdviceRule;

/** The food to replace, with its carbohydrate where it is known. */
type Food = CoachAdviceFood & { readonly carbsG?: number | undefined };

/** A replacement's figures a time; carbohydrate undefined when a share of the food's unknown one. */
interface Figures {
  readonly kcal: number;
  readonly proteinG: number;
  readonly fatG: number;
  readonly carbsG: number | undefined;
  readonly sodiumMg: number | undefined;
}

/**
 * The replacement's figures against `food`: its typical serving, or shares
 * of the food's own, plus and less what the row says. Undefined when they
 * would go below nothing (a tortilla taken from a food smaller than one).
 */
function figuresOf(replacement: CoachSwapReplacement, food: Food): Figures | undefined {
  const base: Figures =
    replacement.serving !== undefined
      ? { ...replacement.serving, sodiumMg: replacement.serving.sodiumMg }
      : replacement.ofFood !== undefined
        ? {
            kcal: food.kcal * replacement.ofFood.kcal,
            proteinG: food.proteinG * replacement.ofFood.proteinG,
            fatG: food.fatG * replacement.ofFood.fatG,
            carbsG: food.carbsG === undefined ? undefined : food.carbsG * replacement.ofFood.carbsG,
            sodiumMg: undefined,
          }
        : { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0, sodiumMg: undefined };
  let figures = base;
  if (replacement.plus !== undefined) figures = addTo(figures, 1, replacement.plus);
  if (replacement.less !== undefined) figures = addTo(figures, -1, replacement.less);
  if (figures.kcal < 0 || figures.proteinG < 0 || figures.fatG < 0 || (figures.carbsG ?? 0) < 0) return undefined;
  if (replacement.serving === undefined && !(figures.kcal > 0)) return undefined;
  return figures;
}

/** `figures` with `by` added (`sign` 1) or taken away (`sign` -1). */
function addTo(figures: Figures, sign: number, by: CoachSwapFigures): Figures {
  return {
    kcal: figures.kcal + sign * by.kcal,
    proteinG: figures.proteinG + sign * by.proteinG,
    fatG: figures.fatG + sign * by.fatG,
    carbsG: figures.carbsG === undefined ? undefined : figures.carbsG + sign * by.carbsG,
    sodiumMg: figures.sodiumMg,
  };
}

/** Whether the swap is worth it and safe: it saves enough, keeps protein, adds no calories or sodium, and the safeguards allow it. */
function qualifies(food: Food, figures: Figures, limits: SwapLimits | undefined): boolean {
  const savesKcal = figures.kcal <= (1 - R.swapKcalSaving) * food.kcal;
  const savesFat = food.fatG > 0 && figures.fatG <= (1 - R.swapFatSaving) * food.fatG;
  if (!(savesKcal || savesFat)) return false;
  if (food.proteinG >= SwapRule.proteinKeptFromG && figures.proteinG < R.swapProteinKept * food.proteinG) return false;
  if (limits?.goal !== 'leanGain' && figures.kcal > TradeRule.kcalCeilingRatio * food.kcal) return false;
  if (figures.sodiumMg !== undefined && (food.sodiumMg === undefined || figures.sodiumMg > food.sodiumMg)) return false;
  return limits === undefined || swapAllowed(food, figures, limits);
}

/**
 * The coach's swap table's replacement for a food or a meal (MM-617): the
 * first row that matches its name (`coachSwapOf`), then the first of the
 * row's replacements that saves enough (a fifth of the calories or two
 * fifths of the fat), keeps 60% of the protein of a food with
 * `SwapRule.proteinKeptFromG` or more, adds no calories past
 * `TradeRule.kcalCeilingRatio` (except on lean gain), is no saltier where
 * the row states its sodium, and is allowed by `limits` where they are
 * given. The `name` is the row's words for the person, the figures are a
 * time, rounded. Undefined when none qualifies.
 */
export function tableSwapOf(
  food: Food,
  group?: FoodGroup | undefined,
  limits?: SwapLimits | undefined,
): CoachAdviceReplacement | undefined {
  const row = coachSwapOf(food.name, group);
  if (row === undefined) return undefined;
  for (const replacement of row.replacements) {
    const figures = figuresOf(replacement, food);
    if (figures === undefined || !qualifies(food, figures, limits)) continue;
    return {
      name: replacement.words,
      kcal: Math.round(figures.kcal),
      proteinG: Math.round(figures.proteinG),
      fatG: Math.round(figures.fatG),
      source: 'table',
    };
  }
  return undefined;
}
