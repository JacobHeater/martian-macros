import type { NutritionRecord } from './NutritionRecord';
import type { WaterRecord } from './WaterRecord';

/**
 * Writes what the user logs in the app to the phone's health platform
 * (MM-70, MM-314), and keeps it in step: an entry changed is written again
 * under its id, an entry removed is removed. Only the app's own records are
 * ever changed or removed. Food and water are written only while
 * `HealthWriting` has them on; otherwise every call is false and nothing on
 * the platform changes.
 */
export interface HealthIntakeWriter {
  /** Writes what was eaten, replacing what was written before under its id. */
  writeNutrition(record: NutritionRecord): Promise<boolean>;

  /** Removes what was written for the food under `id`. */
  removeNutrition(id: string): Promise<boolean>;

  /** Writes a drink of water, replacing what was written before under its id. */
  writeWater(record: WaterRecord): Promise<boolean>;

  /** Removes what was written for the water under `id`. */
  removeWater(id: string): Promise<boolean>;
}
