import type { FoodAnalysisInput } from './FoodAnalysisInput';
import type { FoodDay } from './FoodDay';

/** What a food signal's series is read from (MM-606): the input, and one day per calendar day up to the span's end. */
export interface FoodSpan {
  readonly input: FoodAnalysisInput;

  /** Ascending, one per calendar day, from the trend engine's look-back through the day the span ends. */
  readonly days: readonly FoodDay[];
}
