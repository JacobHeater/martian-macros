import type { PlatformWorkoutSegment } from './PlatformWorkoutSegment';

/**
 * A workout as read from a health platform (MM-189): a session with its
 * span and, on Health Connect, the segments it was given.
 */
export interface PlatformWorkout {
  /** The platform's own id for it; stable across edits (MM-71). */
  readonly platformId: string;

  /**
   * The id the app that wrote it gave it, if any. A workout this app wrote
   * carries its own, which is how it is not imported back (MM-189).
   */
  readonly clientId: string | undefined;

  /**
   * Whether the platform calls it a strength workout (MM-188's import
   * types). Any other kind is imported with its span and no exercises.
   */
  readonly strength: boolean;
  readonly start: Date;
  readonly end: Date;

  /** Oldest first. Always empty from HealthKit. */
  readonly segments: readonly PlatformWorkoutSegment[];

  /** The app or device that wrote it, as `HealthSample` has them. */
  readonly sourceId: string;
  readonly sourceName: string;
}
