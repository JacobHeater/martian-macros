import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import { builtInExercises } from '../../src/domain/training/builtInExercises';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { ItemAnchor } from '../../src/engine/ItemAnchor';
import { volumeJumpInsights } from '../../src/engine/volumeJumpInsights';

const exercisesById = new Map(builtInExercises.map((e) => [e.id, e]));
const bench = 'barbell-bench-press';
const inclineDumbbell = 'incline-dumbbell-bench-press';
const squat = 'back-squat';
const ref = CalendarDate.of(2026, 10, 16);
let nextId = 1;

/** A workout on `date` with `sets` hard sets of each lift; finished unless said. */
function session(date: CalendarDate, lifts: readonly (readonly [string, number])[], { inProgress = false } = {}): Workout {
  const startedAt = new Date(date.year, date.month - 1, date.day, 18);
  return new Workout({
    id: nextId++,
    date,
    startedAt,
    endedAt: inProgress ? undefined : new Date(startedAt.getTime() + 50 * 60 * 1000),
    exercises: lifts.map(
      ([exerciseId, sets]) =>
        new WorkoutExercise({ exerciseId, sets: Array.from({ length: sets }, () => new WorkoutSet({ reps: 8, loadKg: 60 })) }),
    ),
  });
}

/** Chest sets in each of the four weeks before `day`: one workout a week. */
const usualWeeks = (day: CalendarDate, sets: readonly number[]) =>
  sets.flatMap((n, k) => (n === 0 ? [] : [session(day.addDays(-7 * (k + 1)), [[bench, n]])]));

const jumps = (workout: Workout, workouts: readonly Workout[], pauses: readonly Pause[] = []) =>
  volumeJumpInsights({ workout, workouts: [...workouts, workout], exercisesById, pauses });

describe('volumeJumpInsights (MM-366)', () => {
  it('says so under the chest exercise when chest sets jump, with both figures', () => {
    const today = session(ref, [[bench, 14]]);
    const [insight, ...rest] = jumps(today, usualWeeks(ref, [9, 9, 9, 9]));
    expect(rest).toEqual([]);
    expect(insight?.anchor).toEqual(ItemAnchor.exercise(today.id, bench));
    expect(insight?.figures).toMatchObject({ weekSets: 14, usualSets: 9, inProgress: 0 });
    expect(insight?.basis).toBe('pattern');
  });

  it('is said once a workout, under the first exercise for the group', () => {
    const today = session(ref, [[squat, 3], [bench, 7], [inclineDumbbell, 7]]);
    const found = jumps(today, usualWeeks(ref, [9, 9, 9, 9]));
    expect(found.map((i) => i.anchor)).toEqual([ItemAnchor.exercise(today.id, bench)]);
  });

  it('says nothing for a small base', () => {
    expect(jumps(session(ref, [[bench, 5]]), usualWeeks(ref, [2, 2, 2, 2]))).toEqual([]);
  });

  it('says nothing below one and a half times the usual week', () => {
    expect(jumps(session(ref, [[bench, 13]]), usualWeeks(ref, [9, 9, 9, 9]))).toEqual([]);
  });

  it('says nothing without sets for the group in 3 of the 4 weeks before', () => {
    expect(jumps(session(ref, [[bench, 14]]), usualWeeks(ref, [9, 0, 9, 0]))).toEqual([]);
  });

  it('in a workout in progress, counts the finished workouts of the 7 days before it', () => {
    const earlier = session(ref.addDays(-2), [[bench, 14]]);
    const today = session(ref, [[bench, 0]], { inProgress: true });
    const [insight] = jumps(today, [earlier, ...usualWeeks(ref, [9, 9, 9, 9])]);
    expect(insight?.figures).toMatchObject({ weekSets: 14, usualSets: 9, inProgress: 1 });
  });

  it('judges a workout looked back on by its own weeks, not by today', () => {
    const old = ref.addDays(-21);
    const then = session(old, [[bench, 14]]);
    // Training since that workout is not part of what was true then.
    const since = [session(ref.addDays(-14), [[bench, 2]]), session(ref, [[bench, 2]])];
    expect(jumps(then, [...usualWeeks(old, [9, 9, 9, 9]), ...since])).toHaveLength(1);
  });

  it('is shown in its first week, then rests', () => {
    const first = ref.addDays(-7);
    const firstWeek = session(first, [[bench, 14]]);
    const history = [firstWeek, ...usualWeeks(first, [9, 9, 9, 9])];
    expect(jumps(session(first.addDays(3), [[bench, 1]]), history)).toHaveLength(1);
    // Still a jump a week on (20 sets against about 10), but its week has passed.
    expect(jumps(session(ref, [[bench, 20]]), history)).toEqual([]);
  });

  it('says nothing when a pause falls in the weeks it looks at', () => {
    const pause = new Pause({ from: ref.addDays(-20), to: ref.addDays(-15), reason: 'illness' });
    expect(jumps(session(ref, [[bench, 14]]), usualWeeks(ref, [9, 9, 9, 9]), [pause])).toEqual([]);
  });

  it('says nothing under an exercise that was deleted', () => {
    const today = session(ref, [['custom-gone', 14]]);
    expect(jumps(today, usualWeeks(ref, [9, 9, 9, 9]))).toEqual([]);
  });
});
