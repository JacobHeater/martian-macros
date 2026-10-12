import type { FoodDayReader } from './FoodDayReader';
import type { FoodEntryWriter } from './FoodEntryWriter';
import type { RecentFoodReader } from './RecentFoodReader';

/** Reads and writes the food log. */
export interface FoodRepository extends FoodDayReader, RecentFoodReader, FoodEntryWriter {}
