import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { builtInExercises } from '../../src/domain/training/builtInExercises';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { buildStrengthTrends } from '../../src/engine/buildStrengthTrends';
import { consecutiveDeficitWeeks } from '../../src/engine/consecutiveDeficitWeeks';
import { deficitStartOn } from '../../src/engine/deficitStartOn';
import { strengthOnFatLossInsights } from '../../src/engine/strengthOnFatLossInsights';
import type { TargetsRecord } from '../../src/engine/TargetsRecord';
import { targetsFrom } from '../support/targetsFrom';

/**
 * MM-377, on the measurement role's numbers: bench press 100 kg × 6 at RIR 1
 * is an estimate of 123.33 kg; the deficit starts on day 0.
 */
const start = CalendarDate.of(2026, 8, 1);
const day = (n: number) => start.addDays(n);
const exercisesById = new Map(builtInExercises.map((e) => [e.id, e]));
const bench = 'barbell-bench-press';
let nextId = 1;

function session(n: number, loadKg = 100, reps = 6, rir: number | undefined = 1, { inProgress = false, lift = bench } = {}): Workout {
  const date = day(n);
  const startedAt = new Date(date.year, date.month - 1, date.day, 18, nextId % 12);
  return new Workout({
    id: nextId++,
    date,
    startedAt,
    endedAt: inProgress ? undefined : new Date(startedAt.getTime() + 50 * 60 * 1000),
    exercises: [new WorkoutExercise({ exerciseId: lift, sets: [new WorkoutSet({ reps, loadKg, rir })] })],
  });
}

const fatLoss = (from: number, mode: TargetsRecord['mode'] = 'fatLoss', weeklyRateFraction = -0.0075) =>
  targetsFrom(day(from), { mode, weeklyRateFraction });

const judge = (
  workouts: Workout[],
  { history = [fatLoss(-30, 'maintenance', 0), fatLoss(0)], restartOn, stalled = false }: { history?: TargetsRecord[]; restartOn?: CalendarDate; stalled?: boolean } = {},
) => {
  const shown = workouts[workouts.length - 1] as Workout;
  const trends = buildStrengthTrends({ workouts, exercises: builtInExercises, weights: [], today: day(60) });
  return strengthOnFatLossInsights({ workout: shown, trends, history, exercisesById, deficitRestartOn: restartOn, progressStalled: stalled });
};

const steady = (...days: number[]) => days.map((n) => session(n));

describe('deficitStartOn', () => {
  it('is the first of the trailing deficit records, moved up by a restart, as of the day asked', () => {
    const history = [fatLoss(-30, 'maintenance', 0), fatLoss(0), fatLoss(14)];
    expect(deficitStartOn(history, day(46))).toBe(day(0));
    expect(deficitStartOn(history, day(46), { restartOn: day(26) })).toBe(day(26));
    expect(deficitStartOn(history, day(-10))).toBeUndefined();
    expect(consecutiveDeficitWeeks(history, day(46))).toBe(6);
    expect(consecutiveDeficitWeeks(history, day(46), { restartOn: day(26) })).toBe(2);
  });
});

describe('strengthOnFatLossInsights (MM-377)', () => {
  it('held, one bad day absorbed: shown with the figures and the band', () => {
    const workouts = [...steady(-3, 4, 11, 18, 25, 32, 39), session(46, 100, 5)];
    const [insight, ...rest] = judge(workouts);
    expect(rest).toEqual([]);
    expect(insight?.kind).toBe('strengthOnFatLoss');
    expect(insight?.subject).toBe(bench);
    expect(insight?.figures['fromKg']).toBeCloseTo(123.33, 1);
    expect(insight?.figures['toKg']).toBeCloseTo(122.22, 1);
    expect(insight?.figures['heldDownToKg']).toBeCloseTo(120.25, 1);
    expect(insight?.figures).toMatchObject({ weeks: 6, sessions: 7, up: 0, inProgress: 0, startEpochDay: start.epochDay });
  });

  it('not held at 95 kg', () => {
    expect(judge([...steady(-3, 4, 11, 18, 25), session(32, 95), session(39, 95), session(46, 95)])).toEqual([]);
  });

  it('gone up needs 5%; a smaller rise is held', () => {
    const up = judge([...steady(-3, 4, 11, 18, 25), session(32, 107.5), session(39, 107.5), session(46, 107.5)]);
    expect(up[0]?.figures['up']).toBe(1);
    const little = judge([...steady(-3, 4, 11, 18, 25), session(32, 102.5), session(39, 102.5), session(46, 102.5)]);
    expect(little[0]?.figures['up']).toBe(0);
  });

  it('no baseline near the start, or a lone one, says nothing', () => {
    expect(judge(steady(12, 19, 26, 33, 40, 46))).toEqual([]);
    expect(judge(steady(-3, 9, 16, 23, 30, 37, 44))).toEqual([]);
  });

  it('a gap of 29 days says nothing', () => {
    expect(judge(steady(-3, 4, 11, 40, 46))).toEqual([]);
  });

  it('counts sessions on distinct days', () => {
    // From the baseline on day 4: four distinct days with a second session on day 4 counting once.
    expect(judge([...steady(-3, 4), session(4), ...steady(18, 32, 46)])).toHaveLength(1);
    expect(judge([...steady(-3, 4), session(4), ...steady(25, 46)])).toEqual([]);
  });

  it('is judged on the workout’s own date: a later, weaker workout changes nothing', () => {
    const workouts = [...steady(-3, 4, 11, 18, 25, 32, 39), session(46, 100, 5)];
    const later = [...workouts, session(60, 80), session(67, 80)];
    const shown = workouts[workouts.length - 1] as Workout;
    const trends = buildStrengthTrends({ workouts: later, exercises: builtInExercises, weights: [], today: day(70) });
    const [insight] = strengthOnFatLossInsights({ workout: shown, trends, history: [fatLoss(-30, 'maintenance', 0), fatLoss(0)], exercisesById, deficitRestartOn: undefined, progressStalled: false });
    expect(insight?.figures['toKg']).toBeCloseTo(122.22, 1);
  });

  it('in progress takes the last finished session before it and states the fact only', () => {
    const [insight] = judge([...steady(-3, 4, 11, 18, 25, 32, 39), session(46, 100, 6, 1, { inProgress: true })]);
    expect(insight?.figures).toMatchObject({ inProgress: 1, weeks: 6 });
    expect(insight?.figures['toKg']).toBeCloseTo(123.33, 1);
  });

  it('a restart inside the window, a maintenance week, recomp, or a goal switch says nothing', () => {
    const workouts = steady(-3, 4, 11, 18, 25, 32, 39, 46);
    expect(judge(workouts, { restartOn: day(26) })).toEqual([]);
    expect(judge(workouts, { history: [fatLoss(0), fatLoss(35, 'fatLoss', 0), fatLoss(42)] })).toEqual([]);
    expect(judge(workouts, { history: [fatLoss(-30, 'maintenance', 0), fatLoss(0, 'recomp', -0.0025)] })).toEqual([]);
    expect(judge(workouts, { history: [fatLoss(-30, 'maintenance', 0), fatLoss(0, 'recomp', -0.0025), fatLoss(21)] })).toEqual([]);
  });

  it('says nothing while progress is assessed as stalled, or for a bodyweight lift', () => {
    const workouts = steady(-3, 4, 11, 18, 25, 32, 39, 46);
    expect(judge(workouts, { stalled: true })).toEqual([]);
    const pullUps = [-3, 4, 11, 18, 25, 32, 39, 46].map((n) => session(n, 0, 6, 1, { lift: 'pull-up' }));
    expect(judge(pullUps)).toEqual([]);
  });

  it('in pounds the comparison is the same ratio', () => {
    const lb = (n: number, pounds: number) => session(n, pounds * 0.45359237, 5, 2);
    const held = judge([-3, 4, 11, 18, 25, 32, 39].map((n) => lb(n, 225)).concat(lb(46, 225)));
    expect(held[0]?.figures['up']).toBe(0);
    const up = judge([lb(-3, 225), lb(4, 225), lb(11, 225), lb(18, 225), lb(25, 225), lb(32, 240), lb(39, 240), lb(46, 240)]);
    expect(up[0]?.figures['up']).toBe(1);
  });

  it('a deload fails safe', () => {
    expect(judge([...steady(-3, 4, 11, 18, 25), session(32, 80, 8, 4), session(39, 80, 8, 4), session(46, 80, 8, 4)])).toEqual([]);
  });
});
