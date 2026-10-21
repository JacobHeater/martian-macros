import type { HealthDataType } from './HealthDataType';

/**
 * How far back the history of each type has been read (MM-73), kept so a
 * backfill cut short goes on from where it stopped and one that finished
 * is not done again.
 */
export interface HealthBackfillMarks {
  /**
   * The earliest moment from which every reading of `type` has been read,
   * or undefined before a backfill has read anything of it.
   */
  backfilledFrom(type: HealthDataType): Promise<Date | undefined>;

  saveBackfilledFrom(type: HealthDataType, from: Date): Promise<void>;
}
