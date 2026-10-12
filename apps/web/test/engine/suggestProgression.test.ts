import { describe, expect, it } from 'vitest';
import {
  builtInExercises,
  CalendarDate,
  type Exercise,
  ExerciseProgression,
  type GoalMode,
  type UnitSystem,
  Units,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../src/domain';
import { defaultLoadStepKg, defaultRepRange, nextLoadKg, suggestProgression } from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { builtIn } from './support/builtIn';

/** MM-79: what to try next for an exercise, by double progression. */
const squat = builtIn('back-squat');
const pullUp = builtIn('pull-up');
const raise = builtIn('dumbbell-lateral-raise');
const machine = (() => {
  const found = builtInExercises.find((e) => e.equipment === 'machine' && e.load === 'addedWeight');
  if (found === undefined) throw new Error('The library has no machine exercise.');
  return found;
})();

const now = new Date(2026, 9, 12, 18);
const dayMs = 24 * 60 * 60 * 1000;
let nextId = 1;

/** A set as [reps, kg]. */
type Done = readonly [reps: number, kg: number];

/** A finished workout `daysAgo` with one exercise. */
function session(
  daysAgo: number,
  sets: readonly Done[],
  { of, finished = true }: { of?: Exercise; finished?: boolean } = {},
): Workout {
  const start = new Date(now.getTime() - daysAgo * dayMs);
  return new Workout({
    id: nextId++,
    date: CalendarDate.fromDate(start),
    startedAt: start,
    endedAt: finished ? new Date(start.getTime() + 50 * 60 * 1000) : undefined,
    exercises: [
      new WorkoutExercise({
        exerciseId: (of ?? squat).id,
        sets: sets.map(([reps, loadKg]) => new WorkoutSet({ reps, loadKg })),
      }),
    ],
  });
}

const suggest = (
  workouts: Workout[],
  { of, goal = 'leanGain', units = 'metric' }: { of?: Exercise; goal?: GoalMode; units?: UnitSystem } = {},
) =>
  suggestProgression({
    exerciseId: (of ?? squat).id,
    exercise: of ?? squat,
    workouts,
    before: now,
    goal,
    units,
  });

it('there is nothing to suggest for an exercise never done', () => {
  expect(suggest([])).toBeUndefined();
  expect(suggest([session(7, [[8, 60]], { of: pullUp })])).toBeUndefined();
});

it('a workout still in progress is not last time', () => {
  expect(suggest([session(1, [[8, 60]], { finished: false })])).toBeUndefined();
});

it('short of the top of the range: the same load, for more reps', () => {
  const s = suggest([
    session(7, [
      [8, 60],
      [8, 60],
      [7, 60],
    ]),
  ]);
  expect(s?.kind).toBe('addReps');
  expect(s?.loadKg).toBe(60);
  expect(s?.reps).toBe(8);
  expect(s?.lastLoadKg).toBe(60);
  expect(s?.lastReps).toEqual([8, 8, 7]);
});

it('every set at the top of the range: more load, at the bottom', () => {
  const s = suggest([
    session(7, [
      [10, 60],
      [10, 60],
      [10, 60],
    ]),
  ]);
  expect(s?.kind).toBe('addLoad');
  expect(s?.loadKg).toBe(62.5);
  expect(s?.reps).toBe(6);
  expect(s?.rangeTop).toBe(10);
});

it('only the sets at the top load count, so warm-ups do not', () => {
  const s = suggest([
    session(7, [
      [10, 20],
      [5, 40],
      [10, 60],
      [10, 60],
    ]),
  ]);
  expect(s?.kind).toBe('addLoad');
  expect(s?.lastReps).toEqual([10, 10]);
  const backOff = suggest([
    session(7, [
      [7, 60],
      [10, 50],
      [10, 50],
    ]),
  ]);
  expect(backOff?.kind).toBe('addReps');
  expect(backOff?.loadKg).toBe(60);
  expect(backOff?.reps).toBe(7);
});

it('reps below the range are brought up to its bottom, never the load down', () => {
  const s = suggest([
    session(7, [
      [4, 60],
      [3, 60],
    ]),
  ]);
  expect(s?.kind).toBe('addReps');
  expect(s?.loadKg).toBe(60);
  expect(s?.reps).toBe(6);
});

it('the range is 8 to 12 for a lift that is not a barbell lift', () => {
  expect(defaultRepRange(squat)).toEqual([6, 10]);
  expect(defaultRepRange(raise)).toEqual([8, 12]);
  expect(defaultRepRange(undefined)).toEqual([8, 12]);
  const s = suggest(
    [
      session(
        7,
        [
          [10, 8],
          [10, 8],
        ],
        { of: raise },
      ),
    ],
    { of: raise },
  );
  expect(s?.kind).toBe('addReps');
  expect(s?.reps).toBe(10);
});

describe('on a fat loss goal', () => {
  it('the suggestion is to match last time', () => {
    const s = suggest(
      [
        session(7, [
          [8, 60],
          [8, 60],
          [7, 60],
        ]),
      ],
      { goal: 'fatLoss' },
    );
    expect(s?.kind).toBe('match');
    expect(s?.loadKg).toBe(60);
    expect(s?.reps).toBe(8);
  });

  it('even with every set at the top, and even when stalled', () => {
    expect(
      suggest(
        [
          session(7, [
            [10, 60],
            [10, 60],
          ]),
        ],
        { goal: 'fatLoss' },
      )?.kind,
    ).toBe('match');
    expect(
      suggest([session(7, [[8, 60]]), session(14, [[8, 60]]), session(21, [[8, 60]])], { goal: 'fatLoss' })?.kind,
    ).toBe('match');
  });
});

describe('a stall', () => {
  it('is three sessions at one load without more reps: hold', () => {
    const s = suggest([
      session(7, [
        [8, 60],
        [7, 60],
      ]),
      session(14, [
        [8, 60],
        [6, 60],
      ]),
      session(21, [
        [8, 60],
        [7, 60],
      ]),
    ]);
    expect(s?.kind).toBe('hold');
    expect(s?.loadKg).toBe(60);
    expect(s?.reps).toBe(8);
  });

  it('is not two sessions: one bad day is not a stall', () => {
    const s = suggest([
      session(7, [
        [8, 60],
        [7, 60],
      ]),
      session(14, [
        [8, 60],
        [7, 60],
      ]),
    ]);
    expect(s?.kind).toBe('addReps');
  });

  it('is not called when either later session had more reps', () => {
    expect(
      suggest([
        session(7, [
          [8, 60],
          [7, 60],
        ]),
        session(14, [
          [8, 60],
          [8, 60],
        ]),
        session(21, [
          [8, 60],
          [7, 60],
        ]),
      ])?.kind,
    ).toBe('addReps');
  });

  it('is not called across a change of load', () => {
    expect(suggest([session(7, [[6, 62.5]]), session(14, [[6, 62.5]]), session(21, [[10, 60]])])?.kind).toBe(
      'addReps',
    );
  });

  it('is not called across a gap of more than 28 days', () => {
    expect(suggest([session(7, [[8, 60]]), session(14, [[8, 60]]), session(50, [[8, 60]])])?.kind).toBe('addReps');
  });

  it('gives way to more load when every set is at the top', () => {
    expect(suggest([session(7, [[10, 60]]), session(14, [[10, 60]]), session(21, [[10, 60]])])?.kind).toBe(
      'addLoad',
    );
  });
});

describe('the step up in load', () => {
  const next = (exercise: Exercise | undefined, kg: number, units: UnitSystem = 'metric') =>
    nextLoadKg({ exercise, units, loadKg: kg });

  it('is 2.5 kg for a barbell, 2 for a dumbbell, 5 for a machine', () => {
    expect(next(squat, 60)).toBe(62.5);
    expect(next(raise, 8)).toBe(10);
    expect(next(machine, 40)).toBe(45);
    expect(next(undefined, 40)).toBe(42.5);
  });

  it('is a round number of pounds for someone who lifts in pounds', () => {
    const from = Units.lbToKg(135);
    expectClose(Units.kgToLb(next(squat, from, 'imperial') as number), 140, 1e-9);
    expectClose(Units.kgToLb(next(machine, from, 'imperial') as number), 145, 1e-9);
  });

  it('is 2.5 kg on weight added to the body', () => {
    expect(next(pullUp, 5)).toBe(7.5);
  });

  it('is 5 kg less help for assisted work, never past none', () => {
    expect(next(pullUp, -20)).toBe(-15);
    expect(next(pullUp, -3)).toBe(0);
  });

  it('is nothing for the body alone: more reps instead, past the range', () => {
    expect(next(pullUp, 0)).toBeUndefined();
    const s = suggest(
      [
        session(
          7,
          [
            [14, 0],
            [12, 0],
          ],
          { of: pullUp },
        ),
      ],
      { of: pullUp },
    );
    expect(s?.kind).toBe('addReps');
    expect(s?.loadKg).toBe(0);
    expect(s?.reps).toBe(14);
  });
});

describe("a range and step of the user's own", () => {
  const withSettings = (
    workouts: Workout[],
    settings: ExerciseProgression,
    { of, units = 'metric' }: { of?: Exercise; units?: UnitSystem } = {},
  ) =>
    suggestProgression({
      exerciseId: (of ?? squat).id,
      exercise: of ?? squat,
      workouts,
      before: now,
      goal: 'leanGain',
      units,
      settings,
    });

  it('the top of their range decides when load goes up', () => {
    const threeToFive = new ExerciseProgression({ exerciseId: 'back-squat', repsLow: 3, repsHigh: 5 });
    const workouts = [
      session(7, [
        [5, 100],
        [5, 100],
      ]),
    ];
    // In the default 6 to 10 this is short of the top.
    expect(suggest(workouts)?.kind).toBe('addReps');
    const s = withSettings(workouts, threeToFive);
    expect(s?.kind).toBe('addLoad');
    expect(s?.loadKg).toBe(102.5);
    expect(s?.reps).toBe(3);
    expect(s?.rangeTop).toBe(5);
  });

  it('reps are aimed within their range', () => {
    const twelveToFifteen = new ExerciseProgression({ exerciseId: 'back-squat', repsLow: 12, repsHigh: 15 });
    const s = withSettings(
      [
        session(7, [
          [10, 60],
          [10, 60],
        ]),
      ],
      twelveToFifteen,
    );
    expect(s?.kind).toBe('addReps');
    expect(s?.reps).toBe(12);
  });

  it("their load step is used in place of the equipment's", () => {
    const small = new ExerciseProgression({ exerciseId: 'back-squat', repsLow: 6, repsHigh: 10, loadStepKg: 1.25 });
    const s = withSettings(
      [
        session(7, [
          [10, 60],
          [10, 60],
        ]),
      ],
      small,
    );
    expect(s?.loadKg).toBe(61.25);
  });

  it('their step applies to weight added to the body and to assisted work, which still never goes past none', () => {
    const ten = new ExerciseProgression({ exerciseId: 'pull-up', repsLow: 8, repsHigh: 12, loadStepKg: 10 });
    const twoSets = (kg: number) => [
      session(
        7,
        [
          [12, kg],
          [12, kg],
        ],
        { of: pullUp },
      ),
    ];
    expect(withSettings(twoSets(5), ten, { of: pullUp })?.loadKg).toBe(15);
    expect(withSettings(twoSets(-6), ten, { of: pullUp })?.loadKg).toBe(0);
  });

  it('the usual step is the one named for the equipment and unit', () => {
    expect(defaultLoadStepKg({ exercise: squat, units: 'metric' })).toBe(2.5);
    expect(defaultLoadStepKg({ exercise: raise, units: 'metric' })).toBe(2);
    expect(defaultLoadStepKg({ exercise: machine, units: 'metric' })).toBe(5);
    expectClose(Units.kgToLb(defaultLoadStepKg({ exercise: machine, units: 'imperial' })), 10, 1e-9);
    expect(defaultLoadStepKg({ exercise: pullUp, units: 'metric' })).toBe(2.5);
  });
});
