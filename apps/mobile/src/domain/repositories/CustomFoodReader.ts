import type { Watched } from '../../lang/Watched';
import type { CustomFood } from '../food/custom/CustomFood';

/** Reads the foods and recipes the user saved. */
export interface CustomFoodReader {
  /** Every saved food, by name, then the full list after each change. */
  watchCustomFoods(): Watched<CustomFood[]>;
}
