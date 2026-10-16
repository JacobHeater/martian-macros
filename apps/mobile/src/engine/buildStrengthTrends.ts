import type { CalendarDate } from '../domain/CalendarDate';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import type { WeightObservation } from '../domain/WeightObservation';
import { compareStrings } from '../lang/compareStrings';
import { estimatedOneRepMax } from './estimatedOneRepMax';
import type { StrengthPoint } from './StrengthPoint';
import { StrengthTrend } from './StrengthTrend';

/**
 * Recomputable, deterministic strength histories. No weights or sets are
 * invented; a trailing mean softens one bad session without predicting a max.
 */
export function buildStrengthTrends({
  workouts,
  exercises,
  weights,
  today,
}: {
  workouts: Iterable<Workout>;
  exercises: Iterable<Exercise>;
  weights: Iterable<WeightObservation>;
  today: CalendarDate;
}): readonly StrengthTrend[] {
  const finished = [...workouts]
    .filter((workout) => !workout.inProgress && !workout.date.isAfter(today))
    .sort((a, b) => {
      const date = a.date.compareTo(b.date);
      if (date !== 0) return date;
      const time = a.startedAt.getTime() - b.startedAt.getTime();
      return time !== 0 ? time : a.id - b.id;
    });
  const readings = [...weights].sort((a, b) => a.date.compareTo(b.date));
  const result: StrengthTrend[] = [];
  const byId = new Map<string, Exercise>();
  for (const exercise of exercises) byId.set(exercise.id, exercise);
  const exerciseIds = new Set<string>();
  for (const workout of finished) {
    for (const entry of workout.exercises) exerciseIds.add(entry.exerciseId);
  }

  for (const exerciseId of exerciseIds) {
    const exercise = byId.get(exerciseId);
    const points: StrengthPoint[] = [];
    let loggedSessions = 0;
    let recentSessions = 0;
    let lastLoggedOn: CalendarDate | undefined;
    for (const workout of finished) {
      const sets = workout.exercises.filter((entry) => entry.exerciseId === exerciseId).flatMap((e) => e.sets);
      if (sets.length === 0) continue;
      loggedSessions++;
      lastLoggedOn = workout.date;
      if (exercise === undefined) continue;
      let bodyweightKg: number | undefined;
      for (const reading of readings) {
        if (!reading.date.isAfter(workout.date) && reading.date.daysUntil(workout.date) <= 7) {
          bodyweightKg = reading.weightKg;
        }
      }
      let best: number | undefined;
      for (const set of sets) {
        const estimate = estimatedOneRepMax(set, { load: exercise.load, bodyweightKg });
        if (estimate !== undefined && (best === undefined || estimate > best)) {
          best = estimate;
        }
      }
      if (best === undefined) continue;
      if (workout.date.daysUntil(today) < 90) recentSessions++;
      const window = points.filter((point) => point.date.daysUntil(workout.date) <= 28);
      const previous = window.slice(window.length > 2 ? window.length - 2 : 0);
      const values = [...previous.map((point) => point.estimateKg), best];
      points.push({
        workoutId: workout.id,
        date: workout.date,
        estimateKg: best,
        trendKg: values.reduce((a, b) => a + b) / values.length,
      });
    }
    if (loggedSessions > 0) {
      result.push(new StrengthTrend({ exercise, exerciseId, points, loggedSessions, recentSessions, lastLoggedOn }));
    }
  }

  result.sort((a, b) => {
    const count = b.recentSessions - a.recentSessions;
    if (count !== 0) return count;
    const lastA = a.points[a.points.length - 1];
    const lastB = b.points[b.points.length - 1];
    if (lastA !== undefined && lastB !== undefined) {
      const latest = lastB.date.compareTo(lastA.date);
      if (latest !== 0) return latest;
    } else if ((lastA === undefined) !== (lastB === undefined)) {
      return lastA === undefined ? 1 : -1;
    }
    return compareStrings(a.exerciseId, b.exerciseId);
  });
  return result;
}
