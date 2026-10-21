import { describe, expect, it } from 'vitest';
import { CalendarDate, Workout, WorkoutExercise, WorkoutSet } from '../../src/domain';
import { checkTimeSpan, restStartedAt, timedSetsOf } from '../../src/engine';

/** MM-191: the rules for typed times, when a rest began, and which sets can be segments. */
const six = new Date(2026, 9, 5, 18);
const at = (minutes: number, seconds = 0) => new Date(six.getTime() + (minutes * 60 + seconds) * 1000);

describe('typed times', () => {
  it('a start and a later end are fine', () => {
    expect(checkTimeSpan({ start: at(2), end: at(3) })).toBeUndefined();
  });

  it('either may be missing', () => {
    expect(checkTimeSpan({ end: at(3) })).toBeUndefined();
    expect(checkTimeSpan({ start: at(3) })).toBeUndefined();
    expect(checkTimeSpan({})).toBeUndefined();
  });

  it('an end at or before its start is refused', () => {
    expect(checkTimeSpan({ start: at(3), end: at(2) })).toBe('endNotAfterStart');
    expect(checkTimeSpan({ start: at(3), end: at(3) })).toBe('endNotAfterStart');
  });

  it('a time outside the workout is refused', () => {
    expect(checkTimeSpan({ start: at(-1), end: at(3), notBefore: six })).toBe('tooEarly');
    expect(checkTimeSpan({ start: at(2), end: at(61), notAfter: at(60) })).toBe('tooLate');
    expect(checkTimeSpan({ end: at(61), notBefore: six, notAfter: at(60) })).toBe('tooLate');
  });

  it('the bounds themselves are allowed', () => {
    expect(checkTimeSpan({ start: six, end: at(60), notBefore: six, notAfter: at(60) })).toBeUndefined();
  });
});

describe('rest', () => {
  const workout = (exercises: WorkoutExercise[]) =>
    new Workout({ id: 1, date: CalendarDate.of(2026, 10, 5), startedAt: six, exercises });

  it('has not begun before any set has an end', () => {
    expect(restStartedAt(workout([]))).toBeUndefined();
    expect(
      restStartedAt(
        workout([
          new WorkoutExercise({ exerciseId: 'back-squat', sets: [new WorkoutSet({ reps: 8, loadKg: 100 })] }),
        ]),
      ),
    ).toBeUndefined();
  });

  it('begins when the most recently ended set ended', () => {
    const started = restStartedAt(
      workout([
        new WorkoutExercise({
          exerciseId: 'back-squat',
          sets: [
            new WorkoutSet({ reps: 8, loadKg: 100, endedAt: at(5) }),
            new WorkoutSet({ reps: 8, loadKg: 100, endedAt: at(9, 30) }),
          ],
        }),
        new WorkoutExercise({
          exerciseId: 'pull-up',
          sets: [new WorkoutSet({ reps: 6, loadKg: 0, endedAt: at(7) }), new WorkoutSet({ reps: 6, loadKg: 0 })],
        }),
      ]),
    );
    expect(started).toEqual(at(9, 30));
  });
});

describe('sets that can be written as segments', () => {
  const workout = (exercises: WorkoutExercise[]) =>
    new Workout({ id: 1, date: CalendarDate.of(2026, 10, 5), startedAt: six, endedAt: at(30), exercises });

  it('are only the sets with both times, and none is made up', () => {
    const timed = new WorkoutSet({ reps: 8, loadKg: 100, startedAt: at(2), endedAt: at(2, 40) });
    const untimed = new WorkoutSet({ reps: 8, loadKg: 100 });
    const endOnly = new WorkoutSet({ reps: 8, loadKg: 100, endedAt: at(6) });
    const segments = timedSetsOf(
      workout([new WorkoutExercise({ exerciseId: 'back-squat', sets: [timed, untimed, endOnly] })]),
    );
    expect(segments).toEqual([{ exerciseId: 'back-squat', set: timed, startedAt: at(2), endedAt: at(2, 40) }]);
  });

  it('come in the order they began, across exercises', () => {
    const squat = new WorkoutSet({ reps: 8, loadKg: 100, startedAt: at(10), endedAt: at(11) });
    const pullUp = new WorkoutSet({ reps: 6, loadKg: 0, startedAt: at(4), endedAt: at(5) });
    const segments = timedSetsOf(
      workout([
        new WorkoutExercise({ exerciseId: 'back-squat', sets: [squat] }),
        new WorkoutExercise({ exerciseId: 'pull-up', sets: [pullUp] }),
      ]),
    );
    expect(segments.map((s) => s.exerciseId)).toEqual(['pull-up', 'back-squat']);
  });

  it('are none in a workout without a timed set, which is still a session', () => {
    const untimed = workout([
      new WorkoutExercise({ exerciseId: 'back-squat', sets: [new WorkoutSet({ reps: 8, loadKg: 100 })] }),
    ]);
    expect(timedSetsOf(untimed)).toEqual([]);
    expect(untimed.startedAt).toEqual(six);
    expect(untimed.endedAt).toEqual(at(30));
  });
});
