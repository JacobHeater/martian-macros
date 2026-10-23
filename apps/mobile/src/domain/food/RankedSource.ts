import type { FoodEntry } from '../FoodEntry';

/** One food's share of something over a day (MM-561, MM-562): the first entry of it, and what all its entries add. */
export interface RankedSource {
  readonly entry: FoodEntry;
  readonly amount: number;
}
