import { expect, it } from 'vitest';
import {
  type BiologicalSex,
  CalendarDate,
  CoachingPolicy,
  IntakeDay,
  Profile,
  ScreeningAnswers,
  UserSetup,
  WaistObservation,
  type WeightEvent,
  type WeightObservation,
} from '../../src/domain';
import type { Workout } from '../../src/domain/training/Workout';
import {
  assessStall,
  BodyFatEstimate,
  CoachConfidence,
  CoachSnapshot,
  type ConfidenceLevel,
  DailyTargets,
  summarizeAdherence,
  TargetsRecord,
  TdeeEstimate,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';
import { workoutOn } from '../support/workoutOn';
import { trendOf } from './support/trendPoints';

/** MM-140: when progress stalls, which kind of stall it is. */
const today = CalendarDate.of(2026, 3, 1);

const setupFor = (sex: BiologicalSex) =>
  new UserSetup({
    profile: new Profile({ sex, birthDate: CalendarDate.of(1994, 3, 1), heightCm: 175 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: 'fatLoss',
    onboardedOn: today.addDays(-90),
  });

const record = ({
  daysAgo = 60,
  kcal = 2100,
  rate = -0.0075,
  tdee = 2700,
}: { daysAgo?: number; kcal?: number; rate?: number; tdee?: number } = {}) =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-daysAgo),
    mode: rate > 0 ? 'leanGain' : 'fatLoss',
    tdeeKcal: tdee,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
    targets: new DailyTargets({
      kcal,
      proteinG: 160,
      proteinMinimumG: 130,
      fatG: 70,
      carbsG: 220,
      weeklyRateFraction: rate,
    }),
  });

function snapshot({
  sex = 'male',
  lossFraction = 0,
  tdee = 2400,
  floor = 1500,
  level = 'fair',
  creatineOn,
}: {
  sex?: BiologicalSex;
  lossFraction?: number;
  tdee?: number;
  floor?: number;
  level?: ConfidenceLevel;
  creatineOn?: CalendarDate;
} = {}): CoachSnapshot {
  const setup = setupFor(sex);
  return new CoachSnapshot({
    policy: CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today }),
    trend: trendOf({ start: today.addDays(-40), days: 41, levelKg: 85, lossFractionPerWeek: lossFraction }),
    trendWeightKg: 85,
    bodyFat: new BodyFatEstimate({ percent: 25, sigmaPercent: 2 }),
    bmrKcal: 1800,
    calorieFloorKcal: floor,
    tdee: new TdeeEstimate({
      kcal: tdee,
      sigmaKcal: 200,
      status: 'updated',
      usableIntakeDays: 28,
      excludedPartialDays: 0,
      weighIns: 28,
    }),
    confidence: new CoachConfidence({
      level,
      estimate: 'good',
      foodLog: 'good',
      weighIns: 'good',
      stability: 'fair',
      nextStep: 'keepLogging',
      usableFoodDays: 28,
      weighInDays: 28,
    }),
    recommendation: { mode: 'fatLoss', reason: 'cutFirst' },
    lastCreatineEventOn: creatineOn,
  });
}

const ate = (kcal: number, days = 30) =>
  upTo(days).map(
    (i) =>
      new IntakeDay({
        date: today.addDays(-(i + 1)),
        kcal,
        proteinG: 150,
        carbsG: 200,
        fatG: 70,
        completeness: 'complete',
      }),
  );

const weighed = (days = 30): WeightObservation[] =>
  upTo(days).map((i) => ({ date: today.addDays(-(i + 1)), weightKg: 85 }));

const waistOn = (entries: readonly (readonly [daysAgo: number, cm: number])[]) =>
  entries.map(([daysAgo, cm]) => new WaistObservation({ date: today.addDays(-daysAgo), waistCm: cm }));

const assess = ({
  sex = 'male',
  snap,
  history,
  intake,
  weights,
  waist = [],
  events = [],
  workouts = [],
}: {
  sex?: BiologicalSex;
  snap?: CoachSnapshot;
  history?: TargetsRecord[];
  intake?: IntakeDay[];
  weights?: WeightObservation[];
  waist?: WaistObservation[];
  events?: WeightEvent[];
  workouts?: Workout[];
} = {}) =>
  assessStall({
    setup: setupFor(sex),
    snapshot: snap ?? snapshot({ sex }),
    history: history ?? [record()],
    intake: intake ?? ate(2100),
    weights: weights ?? weighed(),
    waist,
    weightEvents: events,
    workouts,
    today,
  });

it('ten days into a new cut is too early to tell', () => {
  const a = assess({ history: [record({ daysAgo: 10 })] });
  expect(a.status).toBe('notAssessed');
  expect(a.notAssessedReason).toBe('earlyInPhase');
});

it('losing at the intended pace is no stall', () => {
  const a = assess({ snap: snapshot({ lossFraction: 0.0075 }) });
  expect(a.status).toBe('noStall');
});

it('it is defined against the goal, not against zero', () => {
  expect(assess({ snap: snapshot({ lossFraction: 0.0075 / 4 }) }).status, 'a quarter of the intended pace').toBe(
    'stalled',
  );
  expect(assess({ snap: snapshot({ lossFraction: 0.0075 / 2 }) }).status, 'half the intended pace').toBe('noStall');
});

it('not assessed while the coach is still learning', () => {
  const a = assess({ snap: snapshot({ level: 'learning' }) });
  expect(a.notAssessedReason).toBe('lowConfidence');
});

it('not assessed within two weeks of starting creatine', () => {
  const a = assess({ snap: snapshot({ creatineOn: today.addDays(-5) }) });
  expect(a.notAssessedReason).toBe('recentLastingEvent');
});

it('maintenance has no pace to fall short of', () => {
  const a = assess({ history: [record({ rate: 0 })] });
  expect(a.notAssessedReason).toBe('noPaceToMeet');
});

it('thin data: the log is too thin to tell', () => {
  const a = assess({ intake: ate(2100, 7) });
  expect(a.diagnosis).toBe('data');
  expect(a.usableFoodDays).toBe(7);
  expect(assess({ weights: weighed(6) }).diagnosis).toBe('data');
});

it('masked by water: the waist is down while the scale held', () => {
  const a = assess({
    waist: waistOn([
      [20, 92.0],
      [14, 91.4],
      [7, 90.6],
      [1, 90.0],
    ]),
  });
  expect(a.diagnosis).toBe('masked');
  // Smoothed (MM-155): the middle of the last three, 90.6, against the
  // entry three weeks back, 92.
  expectClose(a.waistChangeCm, -1.4, 1e-9);
  expect(a.expectedChangeKcal, 'nothing to change').toBeUndefined();
});

it('a waist change inside its noise is not masking', () => {
  const a = assess({
    waist: waistOn([
      [20, 92.0],
      [10, 91.5],
      [1, 91.2],
    ]),
  });
  expect(a.diagnosis).not.toBe('masked');
});

it('masked by a recent passing event', () => {
  const a = assess({ events: [{ date: today.addDays(-4), type: 'largeOrSaltyMeal' }] });
  expect(a.diagnosis).toBe('masked');
  expect(a.maskedByEvent).toBe(true);
});

const lifted = (daysAgo: number) => workoutOn(today.addDays(-daysAgo), [['squat', 5, 100]]);

it('masked by training that started in the last ten days', () => {
  const a = assess({ workouts: [lifted(8), lifted(5), lifted(2)] });
  expect(a.diagnosis).toBe('masked');
  expect(a.maskedByTraining).toBe(true);
  expect(a.maskedByEvent).toBe(false);
});

it('training that has gone on for weeks masks nothing', () => {
  const a = assess({ workouts: [lifted(40), lifted(30), lifted(20), lifted(12), lifted(5), lifted(2)] });
  expect(a.diagnosis).toBe('estimate');
  expect(a.maskedByTraining).toBe(false);
});

it('training taken up again after a month off is a start', () => {
  const a = assess({ workouts: [lifted(60), lifted(50), lifted(6), lifted(3)] });
  expect(a.maskedByTraining).toBe(true);
});

it('a workout still in progress is not yet a day trained', () => {
  const open = { ...lifted(3), endedAt: undefined } as unknown as Workout;
  expect(assess({ workouts: [open] }).maskedByTraining).toBe(false);
});

it('intake above target: both figures are stated', () => {
  const a = assess({ intake: ate(2350) });
  expect(a.diagnosis).toBe('intake');
  expect(a.averageIntakeKcal).toBe(2350);
  expect(a.averageTargetKcal).toBe(2100);
});

it('the figures match the adherence summary for the same period', () => {
  const intake = ate(2350);
  const a = assess({ intake });
  const s = summarizeAdherence({
    through: today.addDays(-1),
    intake,
    weights: weighed(),
    history: [record()],
    days: a.windowDays,
  });
  expect(a.averageIntakeKcal).toBe(s.averageIntakeKcal);
  expect(a.averageTargetKcal).toBe(s.averageTargetKcal);
});

it('the estimate was high: on target, good data, flat weight', () => {
  const a = assess();
  expect(a.diagnosis).toBe('estimate');
  // The estimate fell 300 below the 2,700 the target was built on; one
  // check-in moves the target by at most the weekly limit.
  expect(a.expectedChangeKcal).toBe(-100);
  expect(a.atFloor).toBe(false);
});

it('at the floor no reduction is possible', () => {
  const a = assess({
    snap: snapshot({ tdee: 2000, floor: 1800 }),
    history: [record({ kcal: 1800 })],
    intake: ate(1800),
  });
  expect(a.diagnosis).toBe('estimate');
  expect(a.atFloor).toBe(true);
  expect(a.expectedChangeKcal).toBeUndefined();
});

it('a very low estimate is flagged only under that diagnosis', () => {
  expect(assess({ snap: snapshot({ tdee: 2300 }) }).estimateLow).toBe(true);
  expect(assess({ snap: snapshot({ tdee: 2400 }) }).estimateLow).toBe(false);
  expect(assess({ snap: snapshot({ tdee: 2300 }), intake: ate(2350) }).estimateLow).toBe(false);
});

it('a female profile without cycle data waits for 28 days', () => {
  const early = assess({ sex: 'female', history: [record({ daysAgo: 24 })] });
  expect(early.windowDays).toBe(28);
  expect(early.notAssessedReason).toBe('earlyInPhase');
  expect(assess({ sex: 'female', history: [record({ daysAgo: 30 })] }).status).toBe('stalled');
});

it('lean gain has the mirror: no gain, intake below target', () => {
  const a = assess({ history: [record({ rate: 0.0025 })], intake: ate(1850) });
  expect(a.status).toBe('stalled');
  expect(a.gaining).toBe(true);
  expect(a.diagnosis).toBe('intake');
});
