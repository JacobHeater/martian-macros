import type { SleepNight } from '../SleepNight';

/** Writes nights of sleep; one per calendar day (MM-250). */
export interface SleepWriter {
  /** Sets the night for its day, replacing any existing one. */
  saveSleepNight(night: SleepNight): Promise<void>;
}
