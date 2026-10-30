import type { FoodEntry } from '../../FoodEntry';

/** A food the person logs often (MM-706): its name, how many times, and the entry it was last logged as. */
export interface UsualFood {
  readonly name: string;
  readonly times: number;
  readonly latest: FoodEntry;
}
