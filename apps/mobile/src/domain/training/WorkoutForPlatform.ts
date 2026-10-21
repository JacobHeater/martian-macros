import type { PlatformWorkoutSegment } from './PlatformWorkoutSegment';

/**
 * What the app writes to a health platform for a finished workout
 * (MM-189): a summary, never the only copy. The platform writes it as a
 * session of its own strength type (`STRENGTH_TRAINING` on Android,
 * `traditionalStrengthTraining` on iOS, MM-188).
 */
export interface WorkoutForPlatform {
  /**
   * The app's own stable id for the workout. Writing it again replaces the
   * platform's record, and reading it back is how it is not imported twice.
   */
  readonly clientId: string;
  readonly start: Date;
  readonly end: Date;

  /** Milliseconds, leaving out the time the clock was paused. */
  readonly activeMs: number;

  /**
   * The sets the platform can name, one segment each, oldest first, none
   * overlapping. Empty on a platform that names no exercises.
   */
  readonly segments: readonly PlatformWorkoutSegment[];
}
