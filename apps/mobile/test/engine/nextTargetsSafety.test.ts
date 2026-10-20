import { expect, it } from 'vitest';
import {
  CalendarDate,
  IntakeDay,
  Profile,
  ScreeningAnswers,
  UserSetup,
  type WeightObservation,
} from '../../src/domain';
import {
  analyze,
  CoachConfidence,
  CoachSnapshot,
  nextTargets,
  safetyRaiseCapKcal,
  TdeeEstimate,
} from '../../src/engine';
import { SyntheticUser } from './support/SyntheticUser';
import { deficitStartingOn, trendOf } from './support/trendPoints';

/** MM-115 through `nextTargets`, the function the app calls. */
const start = CalendarDate.of(2026, 1, 1);

const setup = ({
  onboardedOn,
  screening = new ScreeningAnswers(),
}: {
  onboardedOn: CalendarDate;
  screening?: ScreeningAnswers;
}) =>
  new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 }),
    screening,
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: 'fatLoss',
    onboardedOn,
  });

/** A man eating far under his expenditure for `days` days. */
function snapshotAfter(days: number, forSetup: UserSetup): CoachSnapshot {
  const user = new SyntheticUser({
    seed: 9,
    start,
    baseTdeeKcal: 3500,
    startWeightKg: 85,
    bodyFatPercent: 25,
    skipWeighInProbability: 0.1,
  });
  const weights: WeightObservation[] = [];
  const intake: IntakeDay[] = [];
  for (let d = 0; d < days; d++) {
    const day = user.liveDay(2200);
    if (day.weight !== undefined) weights.push(day.weight);
    if (day.intake !== undefined) intake.push(day.intake);
  }
  const snapshot = analyze({ setup: forSetup, weights, intake, today: start.addDays(days) });
  expect(snapshot).toBeDefined();
  return snapshot as CoachSnapshot;
}

it('a clear, too-fast loss raises the target even during calibration', () => {
  // Targets began on day 0; the user (re)started coaching on day 30, so the
  // calibration period is not over on day 35 and ordinary adaptation waits.
  const s = setup({ onboardedOn: start.addDays(30) });
  const snapshot = snapshotAfter(35, s);
  const first = deficitStartingOn(start);
  const next = nextTargets({ setup: s, snapshot, history: [first], today: start.addDays(35) });
  expect(next).toBeDefined();
  expect(next?.targets.flags).toContain('raisedForSafePace');
  expect(next?.targets.kcal).toBeGreaterThan(first.targets.kcal + 100);
  expect(next?.targets.kcal).toBeLessThanOrEqual(first.targets.kcal + safetyRaiseCapKcal + 1e-9);
});

it('the same data waits for calibration when the loss is not too fast', () => {
  const s = setup({ onboardedOn: start.addDays(30) });
  const snapshot = snapshotAfter(35, s);
  // A slower loss: an easier deficit in the same shape of data.
  const slow = new CoachSnapshot({
    policy: snapshot.policy,
    trend: trendOf({ start: start.addDays(15), days: 20, levelKg: 85, lossFractionPerWeek: 0.006 }),
    trendWeightKg: snapshot.trendWeightKg,
    bodyFat: snapshot.bodyFat,
    bmrKcal: snapshot.bmrKcal,
    calorieFloorKcal: snapshot.calorieFloorKcal,
    tdee: snapshot.tdee,
    confidence: snapshot.confidence,
    recommendation: snapshot.recommendation,
  });
  expect(
    nextTargets({ setup: s, snapshot: slow, history: [deficitStartingOn(start)], today: start.addDays(35) }),
  ).toBeUndefined();
});

it('an updated estimate still waits while confidence is Learning', () => {
  const s = setup({ onboardedOn: start });
  const base = snapshotAfter(35, s);
  const snapshot = new CoachSnapshot({
    policy: base.policy,
    trend: trendOf({ start: start.addDays(5), days: 30, levelKg: 85, lossFractionPerWeek: 0 }),
    trendWeightKg: base.trendWeightKg,
    bodyFat: base.bodyFat,
    bmrKcal: base.bmrKcal,
    calorieFloorKcal: base.calorieFloorKcal,
    tdee: new TdeeEstimate({
      kcal: base.tdee.kcal,
      sigmaKcal: base.tdee.sigmaKcal,
      status: 'updated',
      usableIntakeDays: base.tdee.usableIntakeDays,
      excludedPartialDays: base.tdee.excludedPartialDays,
      weighIns: base.tdee.weighIns,
    }),
    confidence: new CoachConfidence({
      level: 'learning',
      estimate: 'learning',
      foodLog: 'good',
      weighIns: 'good',
      stability: 'good',
      nextStep: 'keepLogging',
      usableFoodDays: 24,
      weighInDays: 24,
    }),
    recommendation: base.recommendation,
  });
  expect(
    nextTargets({ setup: s, snapshot, history: [deficitStartingOn(start)], today: start.addDays(35) }),
  ).toBeUndefined();
});

it('nothing is raised before the weekly check-in is due', () => {
  const s = setup({ onboardedOn: start.addDays(30) });
  const snapshot = snapshotAfter(35, s);
  expect(
    nextTargets({
      setup: s,
      snapshot,
      history: [deficitStartingOn(start.addDays(32))],
      today: start.addDays(35),
    }),
  ).toBeUndefined();
});

it('bariatric surgery prevents issuing targets', () => {
  const s = setup({ onboardedOn: start, screening: new ScreeningAnswers({ bariatricSurgery: true }) });
  const snapshot = snapshotAfter(35, s);
  expect(nextTargets({ setup: s, snapshot, history: [], today: start })).toBeUndefined();
});

// MM-114: days the person confirmed as complete at far below the floor do inform the expenditure estimate (MM-27), and
// the target still never goes below the floor or falls faster than the step limit: nothing is cut because of those days.
it('confirmed low days never pull the target below the floor (MM-114)', () => {
  const s = setup({ onboardedOn: start });
  const user = new SyntheticUser({ seed: 11, start, baseTdeeKcal: 2600, startWeightKg: 80, bodyFatPercent: 22, skipWeighInProbability: 0.1 });
  const weights: WeightObservation[] = [];
  const intake: IntakeDay[] = [];
  for (let d = 0; d < 42; d++) {
    const day = user.liveDay(1000);
    if (day.weight !== undefined) weights.push(day.weight);
    if (day.intake !== undefined) intake.push(new IntakeDay({ ...day.intake, completeness: 'complete' }));
  }
  const snapshot = analyze({ setup: s, weights, intake, today: start.addDays(42) });
  expect(snapshot).toBeDefined();
  const first = deficitStartingOn(start);
  const next = nextTargets({ setup: s, snapshot: snapshot as CoachSnapshot, history: [first], today: start.addDays(42) });
  expect(next).toBeDefined();
  expect(next?.targets.kcal).toBeGreaterThanOrEqual((snapshot as CoachSnapshot).calorieFloorKcal - 1e-9);
  // And no faster than a weekly step, whatever the low days say about expenditure (MM-26's limit, well under 300 kcal).
  expect(next?.targets.kcal).toBeGreaterThanOrEqual(first.targets.kcal - 300);
});
