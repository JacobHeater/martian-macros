import type { HealthDataType } from './HealthDataType';

/**
 * One reading from a health platform (MM-67), with where it came from.
 * Compare two with `sameHealthSample`.
 */
export interface HealthSample {
  /**
   * The platform's own id for the reading. It stays the same when the
   * reading is edited, which is how a re-import does not duplicate.
   */
  readonly platformId: string;
  readonly type: HealthDataType;

  /** In the unit of `type`. */
  readonly value: number;

  /** When it was taken, or began. */
  readonly start: Date;

  /** When it ended, for a reading with a span (a workout, steps). */
  readonly end?: Date | undefined;

  /**
   * The app or device that wrote it, as the platform identifies it, and
   * its name as shown to the user, or '' when the platform gives none
   * (MM-395; `healthSourceName` reads it).
   */
  readonly sourceId: string;
  readonly sourceName: string;
}
