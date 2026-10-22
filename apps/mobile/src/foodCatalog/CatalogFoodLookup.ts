import type { CatalogFood } from './CatalogFood';

/** Finds a food again by the pack and id it was found as (MM-456). */
export interface CatalogFoodLookup {
  /**
   * The food `foodId` of pack `packId`, as the pack holds it now, or
   * undefined when that pack is not installed or no longer has it.
   */
  foodById(packId: string, foodId: number): Promise<CatalogFood | undefined>;
}
