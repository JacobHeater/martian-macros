import { describe, expect, it } from 'vitest';
import { CalendarDate, Workout, WorkoutExercise, WorkoutSet } from '../../src/domain';
import { previousSetsOf, recentExerciseIds } from '../../src/engine';

/**
 * MM-75 and MM-76: what the workout log says about last time and about
 * which exercises were used recently.
 */
const monday = new Date(2026, 9, 5, 18);
const dayMs = 24 * 60 * 60 * 1000;

function workout(daysAgo: number, exercises: WorkoutExercise[]): Workout {
  const startedAt = new Date(monday.getTime() - daysAgo * dayMs);
  return new Workout({
    id: daysAgo + 1,
    date: CalendarDate.fromDate(startedAt),
    startedAt,
    endedAt: new Date(startedAt.getTime() + 60 * 60 * 1000),
    exercises,
  });
}

const done = (id: string, reps: readonly number[] = [8]) =>
  new WorkoutExercise({ exerciseId: id, sets: reps.map((r) => new WorkoutSet({ reps: r, loadKg: 100 })) });

describe('recent exercises', () => {
  it('none before anything is logged', () => {
    expect(recentExerciseIds([])).toEqual([]);
  });

  it('most recent workout first, each exercise once', () => {
    const ids = recentExerciseIds([
      workout(7, [done('back-squat'), done('leg-press')]),
      workout(0, [done('pull-up'), done('back-squat')]),
      workout(3, [done('barbell-bench-press')]),
    ]);
    expect(ids).toEqual(['pull-up', 'back-squat', 'barbell-bench-press', 'leg-press']);
  });

  it('an exercise added with no sets yet still counts as used', () => {
    expect(recentExerciseIds([workout(0, [new WorkoutExercise({ exerciseId: 'dip' })])])).toEqual(['dip']);
  });
});

describe('last time', () => {
  it('nothing when the exercise was never logged', () => {
    expect(
      previousSetsOf({ exerciseId: 'back-squat', workouts: [workout(7, [done('pull-up')])], before: monday }),
    ).toEqual([]);
  });

  it('the sets of the most recent earlier workout that has it', () => {
    const sets = previousSetsOf({
      exerciseId: 'back-squat',
      workouts: [
        workout(14, [done('back-squat', [5, 5, 5])]),
        workout(7, [done('back-squat', [8, 7])]),
        workout(3, [done('pull-up')]),
      ],
      before: monday,
    });
    expect(sets.map((s) => s.reps)).toEqual([8, 7]);
  });

  it('never the workout being logged, or a later one', () => {
    const sets = previousSetsOf({
      exerciseId: 'back-squat',
      workouts: [
        workout(7, [done('back-squat', [8])]),
        workout(0, [done('back-squat', [12])]),
        workout(-2, [done('back-squat', [3])]),
      ],
      before: monday,
    });
    expect(sets.map((s) => s.reps)).toEqual([8]);
  });

  it('a workout where it was added but not done is passed over', () => {
    const sets = previousSetsOf({
      exerciseId: 'back-squat',
      workouts: [
        workout(14, [done('back-squat', [5])]),
        workout(7, [new WorkoutExercise({ exerciseId: 'back-squat' })]),
      ],
      before: monday,
    });
    expect(sets.map((s) => s.reps)).toEqual([5]);
  });

  it('done twice in one workout, both lots are shown in order', () => {
    const sets = previousSetsOf({
      exerciseId: 'back-squat',
      workouts: [workout(7, [done('back-squat', [5]), done('pull-up'), done('back-squat', [12, 10])])],
      before: monday,
    });
    expect(sets.map((s) => s.reps)).toEqual([5, 12, 10]);
  });
});
