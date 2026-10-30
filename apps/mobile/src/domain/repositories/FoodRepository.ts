import type { FoodDayReader } from './FoodDayReader';
import type { FoodEntryBatchWriter } from './FoodEntryBatchWriter';
import type { FoodEntryWriter } from './FoodEntryWriter';
import type { FoodRangeReader } from './FoodRangeReader';
import type { LastLoggedReader } from './LastLoggedReader';
import type { LoggedFoodSearch } from './LoggedFoodSearch';
import type { RecentFoodReader } from './RecentFoodReader';
import type { SavedFoodUsageReader } from './SavedFoodUsageReader';

/** Reads and writes the food log. */
export interface FoodRepository extends FoodDayReader, FoodRangeReader, RecentFoodReader, LastLoggedReader, SavedFoodUsageReader, LoggedFoodSearch, FoodEntryWriter, FoodEntryBatchWriter {}
