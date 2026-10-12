import { expect, it } from 'vitest';
import { CalendarDate, Workout, WorkoutExercise, WorkoutSet } from '../../src/domain';
import { buildStrengthTrends, personalRecordsOf } from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { builtIn } from './support/builtIn';
import { only } from './support/only';

/** MM-92: a session that gives a lift its best estimated max so far. */
const today = CalendarDate.of(2026, 10, 11);
const squat = builtIn('back-squat');
const row = builtIn('barbell-row');

/** A set of an exercise: its id, reps and kilograms. */
type Done = readonly [exerciseId: string, reps: number, kg: number];

/** A finished workout `daysAgo`, one set of each exercise given. */
function trained(id: number, daysAgo: number, sets: readonly Done[], finished = true): Workout {
  const date = today.addDays(-daysAgo);
  const start = new Date(date.year, date.month - 1, date.day, 18);
  return new Workout({
    id,
    date,
    startedAt: start,
    endedAt: finished ? new Date(start.getTime() + 50 * 60 * 1000) : undefined,
    exercises: sets.map(
      ([exerciseId, reps, loadKg]) => new WorkoutExercise({ exerciseId, sets: [new WorkoutSet({ reps, loadKg })] }),
    ),
  });
}

const records = (workouts: Workout[]) =>
  personalRecordsOf(buildStrengthTrends({ workouts, exercises: [squat, row], weights: [], today }));

it('the first session of a lift sets no record', () => {
  expect(records([trained(1, 7, [[squat.id, 6, 100]])]).size).toBe(0);
});

it('a better session is a record, with what it beat', () => {
  const found = records([trained(1, 14, [[squat.id, 6, 100]]), trained(2, 7, [[squat.id, 6, 105]])]);
  expect([...found.keys()]).toEqual([2]);
  const record = only(found.get(2) ?? []);
  expect(record.exerciseId).toBe(squat.id);
  expect(record.name).toBe(squat.name);
  expectClose(record.estimateKg, 105 * (1 + 6 / 30), 1e-9);
  expectClose(record.previousBestKg, 100 * (1 + 6 / 30), 1e-9);
});

it('more reps at the same load is a record too', () => {
  const found = records([trained(1, 14, [[squat.id, 6, 100]]), trained(2, 7, [[squat.id, 7, 100]])]);
  expect(found.get(2)).toHaveLength(1);
});

it('matching the best is not a record', () => {
  expect(records([trained(1, 14, [[squat.id, 6, 100]]), trained(2, 7, [[squat.id, 6, 100]])]).size).toBe(0);
});

it('a record has to beat every earlier session, not only the last', () => {
  const found = records([
    trained(1, 21, [[squat.id, 6, 110]]),
    trained(2, 14, [[squat.id, 6, 100]]),
    trained(3, 7, [[squat.id, 6, 105]]),
  ]);
  expect(found.size).toBe(0);
});

it('a record stays one after a later session beats it', () => {
  const found = records([
    trained(1, 21, [[squat.id, 6, 100]]),
    trained(2, 14, [[squat.id, 6, 105]]),
    trained(3, 7, [[squat.id, 6, 110]]),
  ]);
  expect([...found.keys()].sort((a, b) => a - b)).toEqual([2, 3]);
  expectClose(only(found.get(3) ?? []).previousBestKg, 105 * 1.2, 1e-9);
});

it('one workout can set a record on more than one lift', () => {
  const found = records([
    trained(1, 14, [
      [squat.id, 6, 100],
      [row.id, 6, 60],
    ]),
    trained(2, 7, [
      [squat.id, 6, 105],
      [row.id, 6, 62.5],
    ]),
  ]);
  expect(found.get(2)?.map((r) => r.exerciseId)).toEqual([squat.id, row.id]);
});

it('a workout still in progress sets none yet', () => {
  expect(
    records([trained(1, 14, [[squat.id, 6, 100]]), trained(2, 0, [[squat.id, 6, 120]], false)]).size,
  ).toBe(0);
});
