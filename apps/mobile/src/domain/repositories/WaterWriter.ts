import type { WaterEntry } from '../water/WaterEntry';

/** Writes the water log (MM-313). */
export interface WaterWriter {
  /** Saves `entry` (its id is ignored) and returns the id it was given. */
  addWater(entry: WaterEntry): Promise<number>;

  /** Replaces the saved entry with `entry`'s id: its amount changed, its day and time kept (MM-318). */
  updateWater(entry: WaterEntry): Promise<void>;

  /** Removes the entry with `id`; nothing happens when there is none. */
  removeWater(id: number): Promise<void>;
}
