import { workoutClientIdPrefix } from '../engine/workoutClientIdPrefix';

/**
 * A workout's client id with the write namespace after the app's prefix
 * (MM-522): still starting with `workoutClientIdPrefix`, so a workout the app
 * wrote before or after any erase is known as its own and never imported,
 * and never the id of a workout written before an erase.
 */
export function namespacedWorkoutId(clientId: string, namespace: string): string {
  return clientId.startsWith(workoutClientIdPrefix)
    ? `${workoutClientIdPrefix}${namespace}-${clientId.slice(workoutClientIdPrefix.length)}`
    : `${workoutClientIdPrefix}${namespace}-${clientId}`;
}
