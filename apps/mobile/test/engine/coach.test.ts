import { beforeEach, describe, expect, it } from 'vitest';
import {
  CalendarDate,
  type GoalMode,
  type IntakeDay,
  Profile,
  ScreeningAnswers,
  UserSetup,
  type WeightObservation,
} from '../../src/domain';
import {
  analyze,
  type CoachSnapshot,
  consecutiveDeficitWeeks,
  DailyTargets,
  nextTargets,
  TargetsRecord,
} from '../../src/engine';
import { SyntheticUser } from './support/SyntheticUser';

const start = CalendarDate.of(2026, 1, 1);

const setup = (mode: GoalMode = 'fatLoss') =>
  new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: mode,
    onboardedOn: start,
  });

/** Simulates `days` of a user eating to 2200 kcal, from `start`. */
function history(days: number): { weights: WeightObservation[]; intake: IntakeDay[] } {
  const user = new SyntheticUser({ seed: 7, start, baseTdeeKcal: 2900 });
  const weights: WeightObservation[] = [];
  const intake: IntakeDay[] = [];
  for (let d = 0; d < days; d++) {
    const day = user.liveDay(2200);
    if (day.weight !== undefined) weights.push(day.weight);
    if (day.intake !== undefined) intake.push(day.intake);
  }
  return { weights, intake };
}

function snapshotAt(
  day: number,
  { forSetup, logFood = true }: { forSetup?: UserSetup; logFood?: boolean } = {},
): CoachSnapshot {
  const { weights, intake } = history(day);
  const snapshot = analyze({
    setup: forSetup ?? setup(),
    weights,
    intake: logFood ? intake : [],
    today: start.addDays(day),
  });
  expect(snapshot).toBeDefined();
  return snapshot as CoachSnapshot;
}

it('there is nothing to analyse before the first weigh-in', () => {
  expect(analyze({ setup: setup(), weights: [], intake: [], today: start })).toBeUndefined();
});

it('a single weigh-in is enough for a snapshot and first targets', () => {
  const snapshot = analyze({
    setup: setup(),
    weights: [{ date: start, weightKg: 85 }],
    intake: [],
    today: start,
  }) as CoachSnapshot;
  expect(snapshot.trendWeightKg).toBe(85);
  expect(snapshot.tdee.status).toBe('held');

  const first = nextTargets({ setup: setup(), snapshot, history: [], today: start }) as TargetsRecord;
  expect(first.effectiveFrom).toBe(start);
  expect(first.targets.kcal).toBeLessThan(snapshot.tdee.kcal);
  expect(first.tdeeStatus).toBe('held');
});

describe('check-in cadence', () => {
  let first: TargetsRecord;

  beforeEach(() => {
    first = nextTargets({ setup: setup(), snapshot: snapshotAt(1), history: [], today: start }) as TargetsRecord;
  });

  const at = (day: number, { logFood = true }: { logFood?: boolean } = {}) =>
    nextTargets({
      setup: setup(),
      snapshot: snapshotAt(day, { logFood }),
      history: [first],
      today: start.addDays(day),
    });

  it('holds within the same week', () => {
    expect(at(3)).toBeUndefined();
  });

  it('holds through the calibration period even with good data', () => {
    expect(at(7)).toBeUndefined();
    expect(at(13)).toBeUndefined();
  });

  it('adapts once calibration ends, by a limited step', () => {
    const next = at(14) as TargetsRecord;
    expect(next.tdeeStatus).toBe('updated');
    expect(next.effectiveFrom).toBe(start.addDays(14));
    expect(Math.abs(next.targets.kcal - first.targets.kcal)).toBeLessThanOrEqual(100 + 1e-9);
  });

  it('never changes targets while the estimator is holding', () => {
    expect(at(21, { logFood: false })).toBeUndefined();
  });

  it('a goal change applies immediately, with no step limit', () => {
    const maintenance = setup('maintenance');
    const next = nextTargets({
      setup: maintenance,
      snapshot: snapshotAt(3, { forSetup: maintenance }),
      history: [first],
      today: start.addDays(3),
    }) as TargetsRecord;
    expect(next.mode).toBe('maintenance');
    expect(next.targets.weeklyRateFraction).toBe(0);
    expect(next.targets.kcal - first.targets.kcal).toBeGreaterThan(100);
  });
});

it('blocked users get no targets', () => {
  const minor = new UserSetup({
    profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(2012, 1, 1), heightCm: 160 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'novice',
    trainingDaysPerWeek: 2,
    goalMode: 'fatLoss',
    onboardedOn: start,
  });
  const snapshot = analyze({
    setup: minor,
    weights: [{ date: start, weightKg: 55 }],
    intake: [],
    today: start,
  }) as CoachSnapshot;
  expect(nextTargets({ setup: minor, snapshot, history: [], today: start })).toBeUndefined();
});

it('counts whole weeks of unbroken deficit', () => {
  const record = (day: number, rate: number) =>
    new TargetsRecord({
      effectiveFrom: start.addDays(day),
      mode: 'fatLoss',
      tdeeKcal: 2500,
      tdeeSigmaKcal: 200,
      tdeeStatus: 'updated',
      targets: new DailyTargets({ kcal: 2000, proteinG: 150, fatG: 60, carbsG: 200, weeklyRateFraction: rate }),
    });
  const today = start.addDays(50);
  expect(consecutiveDeficitWeeks([], today)).toBe(0);
  expect(consecutiveDeficitWeeks([record(0, -0.007), record(14, -0.007)], today)).toBe(7);
  // A maintenance break resets the count.
  expect(consecutiveDeficitWeeks([record(0, -0.007), record(21, 0), record(28, -0.007)], today)).toBe(3);
});
