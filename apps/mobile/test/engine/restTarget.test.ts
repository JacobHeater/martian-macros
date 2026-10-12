import { describe, expect, it } from 'vitest';
import { CalendarDate, Workout, WorkoutExercise, WorkoutSet } from '../../src/domain';
import { lastRestTargetMsOf, placeTimeOfDay, restTargetMsOf } from '../../src/engine';

/**
 * MM-191: the rest a user means to take, and where a typed time of day
 * falls for a workout that runs past midnight.
 */
const six = new Date(2026, 9, 5, 18);
const at = (minutes: number) => new Date(six.getTime() + minutes * 60 * 1000);
const seconds = (n: number) => n * 1000;
const minutes = (n: number) => n * 60 * 1000;

const workout = (exercises: WorkoutExercise[], { id = 1, startedAt }: { id?: number; startedAt?: Date } = {}) =>
  new Workout({ id, date: CalendarDate.of(2026, 10, 5), startedAt: startedAt ?? six, exercises });

describe('the rest target now', () => {
  it('is that of the exercise whose set ended last', () => {
    const target = restTargetMsOf(
      workout([
        new WorkoutExercise({
          exerciseId: 'back-squat',
          restTargetMs: minutes(3),
          sets: [new WorkoutSet({ reps: 8, loadKg: 100, endedAt: at(5) })],
        }),
        new WorkoutExercise({
          exerciseId: 'leg-curl',
          restTargetMs: seconds(90),
          sets: [new WorkoutSet({ reps: 12, loadKg: 40, endedAt: at(9) })],
        }),
      ]),
    );
    expect(target).toBe(seconds(90));
  });

  it('is none when that exercise has none', () => {
    const target = restTargetMsOf(
      workout([
        new WorkoutExercise({
          exerciseId: 'back-squat',
          restTargetMs: minutes(3),
          sets: [new WorkoutSet({ reps: 8, loadKg: 100, endedAt: at(5) })],
        }),
        new WorkoutExercise({
          exerciseId: 'leg-curl',
          sets: [new WorkoutSet({ reps: 12, loadKg: 40, endedAt: at(9) })],
        }),
      ]),
    );
    expect(target).toBeUndefined();
  });

  it('is none before any set has ended', () => {
    expect(
      restTargetMsOf(
        workout([
          new WorkoutExercise({
            exerciseId: 'back-squat',
            restTargetMs: minutes(3),
            sets: [new WorkoutSet({ reps: 8, loadKg: 100 })],
          }),
        ]),
      ),
    ).toBeUndefined();
  });
});

describe('the rest target an exercise had last', () => {
  it('comes from the most recently started workout with it', () => {
    const target = lastRestTargetMsOf({
      exerciseId: 'back-squat',
      workouts: [
        workout([new WorkoutExercise({ exerciseId: 'back-squat', restTargetMs: minutes(2) })], {
          startedAt: new Date(2026, 9, 1, 18),
        }),
        workout([new WorkoutExercise({ exerciseId: 'back-squat', restTargetMs: minutes(3) })], {
          id: 2,
          startedAt: new Date(2026, 9, 3, 18),
        }),
        workout([new WorkoutExercise({ exerciseId: 'leg-curl', restTargetMs: minutes(1) })], {
          id: 3,
          startedAt: new Date(2026, 9, 4, 18),
        }),
      ],
    });
    expect(target).toBe(minutes(3));
  });

  it('is none when it was turned off since', () => {
    const target = lastRestTargetMsOf({
      exerciseId: 'back-squat',
      workouts: [
        workout([new WorkoutExercise({ exerciseId: 'back-squat', restTargetMs: minutes(2) })], {
          startedAt: new Date(2026, 9, 1, 18),
        }),
        workout([new WorkoutExercise({ exerciseId: 'back-squat' })], { id: 2, startedAt: new Date(2026, 9, 3, 18) }),
      ],
    });
    expect(target).toBeUndefined();
  });

  it('is none for an exercise never done', () => {
    expect(lastRestTargetMsOf({ exerciseId: 'dip', workouts: [] })).toBeUndefined();
  });
});

describe('a typed time of day', () => {
  const began = new Date(2026, 9, 5, 23, 30);
  const ended = new Date(2026, 9, 6, 0, 40);
  const timeOfDay = (hour: number, minute: number, second = 0) => ((hour * 60 + minute) * 60 + second) * 1000;
  const place = (hour: number, minute: number, second = 0) =>
    placeTimeOfDay({ notBefore: began, notAfter: ended, timeOfDayMs: timeOfDay(hour, minute, second) });

  it('is on the day the workout began when it fits there', () => {
    expect(place(23, 45, 10)).toEqual(new Date(2026, 9, 5, 23, 45, 10));
    expect(place(23, 30)).toEqual(began);
  });

  it('is on the next day when the workout ran past midnight', () => {
    expect(place(0, 20, 5)).toEqual(new Date(2026, 9, 6, 0, 20, 5));
    expect(place(0, 40)).toEqual(ended);
  });

  it('is not moved to fit when it fits neither day', () => {
    // 1:00 the next day is after the end; it stays on the first day,
    // where the caller refuses it as before the start.
    expect(place(1, 0)).toEqual(new Date(2026, 9, 5, 1));
    expect(place(22, 0)).toEqual(new Date(2026, 9, 5, 22));
  });

  it('is not put on the next day when that is half a day on', () => {
    // 23:20 against a 23:30 start is a slip, not a 23 hour 50 minute
    // workout.
    const placed = placeTimeOfDay({
      notBefore: began,
      notAfter: new Date(2026, 9, 7),
      timeOfDayMs: timeOfDay(23, 20),
    });
    expect(placed).toEqual(new Date(2026, 9, 5, 23, 20));
  });
});
