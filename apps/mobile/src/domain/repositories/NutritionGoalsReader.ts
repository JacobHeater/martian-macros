import type { Watched } from '../../lang/Watched';
import type { NutritionGoals } from '../NutritionGoals';

/** Reads the sodium limit and the water goal (MM-311, MM-313). */
export interface NutritionGoalsReader {
  /** The goals, then each change. Both switched off until set. */
  watchNutritionGoals(): Watched<NutritionGoals>;
}
