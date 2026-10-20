import type { Watched } from '../../lang/Watched';
import type { SleepNight } from '../SleepNight';

/** Reads the nights of sleep kept in the app's own record (MM-250). */
export interface SleepReader {
  /** Every night, oldest first, then the full list after each change. */
  watchSleepNights(): Watched<SleepNight[]>;
}
