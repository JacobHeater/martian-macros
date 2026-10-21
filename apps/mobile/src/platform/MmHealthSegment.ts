/**
 * One exercise segment of a workout as the plugin hands it over or is
 * handed it (MM-489): Health Connect's `EXERCISE_SEGMENT_TYPE_` integer and
 * its span. Repetitions are left out when the platform has none.
 */
export interface MmHealthSegment {
  readonly segmentId: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly repetitions?: number;
}
