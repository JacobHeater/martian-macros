import type { MealBreakdownAnalysis } from '../../engine/analysis/MealBreakdownAnalysis';
import { mealMovesText } from './mealMovesText';

/**
 * The deterministic coaching paragraph for the on-demand "Coach breakdown"
 * meal sheet (MM-663, MM-666): since MM-684 the approved lines of
 * `mealMovesText`, said without a model and as the fallback with one.
 */
export function mealBreakdownArchetypeText(analysis: MealBreakdownAnalysis): string {
  return mealMovesText(analysis);
}
