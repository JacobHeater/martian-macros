import { TradeRule } from '../TradeRule';
import type { SwapLimits } from './SwapLimits';

/** A side of a swap, a time; carbohydrate where it is known. */
interface Figures {
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG?: number | undefined;
}

/**
 * Whether the safeguards allow `replacement` in `food`'s place (MM-617):
 * never fewer calories under `noFewerKcal`; never `TradeRule.insulinCarbDropG`
 * less carbohydrate under `noCarbDrop`, and not at all when either side's is
 * unknown; never `TradeRule.proteinGainG` more protein under `noProteinGain`.
 */
export function swapAllowed(food: Figures, replacement: Figures, limits: SwapLimits): boolean {
  if (limits.noFewerKcal && replacement.kcal < food.kcal) return false;
  if (limits.noCarbDrop) {
    if (food.carbsG === undefined || replacement.carbsG === undefined) return false;
    if (replacement.carbsG < food.carbsG - TradeRule.insulinCarbDropG) return false;
  }
  if (limits.noProteinGain && replacement.proteinG - food.proteinG >= TradeRule.proteinGainG) return false;
  return true;
}
