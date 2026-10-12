import { WorkoutSet } from '../domain';

/** Reps in reserve as shown: 0 to 4, then "5+". */
export function rirText(rir: number): string {
  return rir >= WorkoutSet.maxRir ? '5+' : `${rir}`;
}
