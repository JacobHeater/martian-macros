import type { MmHealthSegment } from './MmHealthSegment';
import type { MmHealthWorkout } from './MmHealthWorkout';

/**
 * The health plugin's workouts (MM-489): read with their segments, and
 * written as a strength session under the app's own id, so writing again
 * replaces it. Writing needs "workouts" on (`MmHealthWritingApi`); a read
 * or a write the platform refuses is rejected.
 */
export interface MmHealthWorkoutsApi {
  /** Every workout starting from `fromMs` up to, not including, `toMs`. */
  readWorkouts(options: { fromMs: number; toMs: number }): Promise<{ workouts: MmHealthWorkout[] }>;

  /** Segments are written only on Health Connect; Apple Health is given the session alone. */
  writeWorkout(options: {
    clientId: string;
    startMs: number;
    endMs: number;
    segments: MmHealthSegment[];
  }): Promise<{ written: boolean }>;

  /** Removes the app's own workout written under `clientId` (MM-515); needs "workouts" on. */
  removeWorkout(options: { clientId: string }): Promise<{ removed: boolean }>;
}
