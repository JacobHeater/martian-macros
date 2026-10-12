import type { CustomFoodReader } from './CustomFoodReader';
import type { CustomFoodWriter } from './CustomFoodWriter';

/** Reads and writes the user's own foods and recipes. */
export interface CustomFoodRepository extends CustomFoodReader, CustomFoodWriter {}
