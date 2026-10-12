import type { Workout } from '../domain';

/**
 * A workout in a line (MM-75): "3 exercises · 9 sets · 55 min". The
 * duration is left out while it is in progress. With `records`, the
 * personal records it set follow (MM-92): "· 1 personal record".
 */
export function workoutSummaryText(workout: Workout, { records = 0 }: { records?: number } = {}): string {
  const exercises = workout.exercises.length;
  const sets = workout.setCount;
  const ended = workout.endedAt;
  const parts = [exercises === 1 ? '1 exercise' : `${exercises} exercises`, sets === 1 ? '1 set' : `${sets} sets`];
  if (ended !== undefined) parts.push(`${Math.trunc(workout.activeMs(ended) / 60000)} min`);
  if (records === 1) parts.push('1 personal record');
  if (records > 1) parts.push(`${records} personal records`);
  return parts.join(' · ');
}
