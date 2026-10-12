import { describe, expect, it } from 'vitest';
import { CalendarDate, Workout, WorkoutExercise, WorkoutSet } from '../../src/domain';
import { checkTimeSpan, restStartedAt } from '../../src/engine';

/** MM-191: the rules for typed times, and when a rest began. */
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
