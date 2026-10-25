import { TradeRule } from '../TradeRule';

/** A food's figures, a time. */
interface Figures {
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly alcoholG?: number | undefined;
}

/**
 * Whether a food's figures can be read (MM-607): calories, macros
 * explaining `TradeRule.knownMacrosShare` of them, and not a drink of
 * alcohol (`TradeRule.alcoholShare`).
 */
export function readableFood(food: Figures): boolean {
  if (!(food.kcal > 0)) return false;
  const alcoholKcal = 7 * (food.alcoholG ?? 0);
  const explained = 4 * food.proteinG + 4 * food.carbsG + 9 * food.fatG + alcoholKcal;
  return explained >= TradeRule.knownMacrosShare * food.kcal && alcoholKcal < TradeRule.alcoholShare * food.kcal;
}
