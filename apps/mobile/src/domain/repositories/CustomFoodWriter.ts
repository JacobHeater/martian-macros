import type { CustomFood } from '../food/custom/CustomFood';

/** Saves and deletes the user's own foods and recipes. */
export interface CustomFoodWriter {
  /**
   * Saves `food`: a new one when its id is 0, otherwise a replacement of the
   * one with that id. Returns its id. Entries already logged from it are not
   * touched.
   */
  saveCustomFood(food: CustomFood): Promise<number>;

  /** Removes the food with `id`. Does nothing if there is none. */
  deleteCustomFood(id: number): Promise<void>;
}
