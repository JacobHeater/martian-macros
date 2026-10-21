/**
 * One set inside a workout on a health platform (MM-188, MM-189): a Health
 * Connect exercise segment. HealthKit has none.
 */
export interface PlatformWorkoutSegment {
  /**
   * The platform's `EXERCISE_SEGMENT_TYPE_` integer. Read as given, so a type
   * the library cannot place is kept and becomes "Other exercise";
   * `HealthConnectSegment.fromPlatformId` names the ones it can.
   */
  readonly segmentId: number;

  /** Both are required by the platform, and never invented by the app. */
  readonly start: Date;
  readonly end: Date;

  /** Undefined when the platform gave none. */
  readonly repetitions: number | undefined;

  /**
   * Kilograms, when the platform gave a weight. Only an alpha of the client
   * library carries one, so the app never writes it yet (MM-188).
   */
  readonly weightKg: number | undefined;
}
