import type { MealMove } from './MealMove';
import type { MoveFood } from './MoveFood';

/**
 * A meal's moves (MM-684), ranked by the day's gap, and the one the coach
 * orders (`best`, the first). No outlier and no moves on the protected
 * path, or for a meal that is fine with the day's protein covered.
 */
export interface MealMoves {
  /** The food with the most calories not backed by protein at the day's target density (MM-666). */
  readonly outlier: (MoveFood & { readonly proteinDensity: number }) | undefined;
  readonly moves: readonly MealMove[];
  readonly best: MealMove | undefined;
}
