import { expect, it } from 'vitest';
import {
  CalendarDate,
  Profile,
  ScreeningAnswers,
  UserSetup,
  type WeightEvent,
  type WeightEventType,
  type WeightObservation,
} from '../../src/domain';
import {
  analyze,
  type CoachSnapshot,
  DailyTargets,
  effectiveWeightEvents,
  nextTargets,
  passingWeightEventNoise,
  TargetsRecord,
  weightEventStepDays,
  WeightTrendModel,
  type WeightTrendPoint,
} from '../../src/engine';
import { clamp } from '../../src/lang/clamp';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';
import { simulate } from './support/simulate';
import { SyntheticUser } from './support/SyntheticUser';

const start = CalendarDate.of(2026, 1, 1);
const creatineStartedOn = start.addDays(21);

const setup = () =>
  new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: 'fatLoss',
    onboardedOn: start,
    bodyFatPercent: 25,
  });

/** `weights` with a water step of `signedKg` rising over the ten days from `from`. */
const withStep = (weights: readonly WeightObservation[], from: CalendarDate, signedKg: number): WeightObservation[] =>
  weights.map((observation) => ({
    date: observation.date,
    weightKg: observation.weightKg + (signedKg * clamp(from.daysUntil(observation.date) + 1, 0, 10)) / 10,
  }));

const before = <T extends { date: CalendarDate }>(items: readonly T[], day: CalendarDate) =>
  items.filter((item) => item.date.isBefore(day));

it('declared creatine step holds targets until its transition is excluded', () => {
  const logs = simulate(
    new SyntheticUser({
      seed: 314,
      start,
      baseTdeeKcal: 2800,
      adherenceSigmaKcal: 0,
      adaptationKcalPerKg: 0,
      entrySigma: 0,
    }),
    { days: 56, loggedKcal: 2300 },
  );
  const waterStep = withStep(logs.weights, creatineStartedOn, 1.5);
  const initialTargets = new TargetsRecord({
    effectiveFrom: start,
    mode: 'fatLoss',
    tdeeKcal: 2800,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
    targets: new DailyTargets({ kcal: 2300, proteinG: 160, fatG: 70, carbsG: 250, weeklyRateFraction: -0.0075 }),
  });
  const undeclaredToday = start.addDays(35);
  const undeclared = analyze({
    setup: setup(),
    weights: before(waterStep, undeclaredToday),
    intake: before(logs.intake, undeclaredToday),
    today: undeclaredToday,
    history: [initialTargets],
  }) as CoachSnapshot;
  const noStepBaseline = analyze({
    setup: setup(),
    weights: before(logs.weights, undeclaredToday),
    intake: before(logs.intake, undeclaredToday),
    today: undeclaredToday,
    history: [initialTargets],
  }) as CoachSnapshot;
  const undeclaredError = noStepBaseline.tdee.kcal - undeclared.tdee.kcal;
  expect(undeclared.tdee.status).toBe('updated');
  expectClose(undeclaredError, 435, 25);

  for (const checkInDay of [28, 35, 42, 49]) {
    const today = start.addDays(checkInDay);
    const snapshot = analyze({
      setup: setup(),
      weights: before(waterStep, today),
      intake: before(logs.intake, today),
      today,
      history: [initialTargets],
      weightEvents: [{ date: creatineStartedOn, type: 'startedCreatine' }],
    }) as CoachSnapshot;
    const control = analyze({
      setup: setup(),
      weights: before(logs.weights, today),
      intake: before(logs.intake, today),
      history: [initialTargets],
      today,
    }) as CoachSnapshot;
    const declaredError = initialTargets.tdeeKcal - snapshot.tdee.kcal;
    expect(
      declaredError,
      `day ${checkInDay}: event=${snapshot.tdee.kcal}, pre-event=${initialTargets.tdeeKcal}`,
    ).toBeLessThan(100);
    expect(control.tdee.kcal - snapshot.tdee.kcal, `day ${checkInDay} versus matched no-step control`).toBeLessThan(
      100,
    );
    expect(declaredError).toBeLessThan(undeclaredError);
    if (checkInDay === 49) {
      expect(snapshot.tdee.status).toBe('held');
      expect(snapshot.tdee.settlingUntil).toBe(creatineStartedOn.addDays(weightEventStepDays - 1));
    }
    const next = nextTargets({ setup: setup(), snapshot, history: [initialTargets], today });
    expect(
      next?.targets.kcal ?? initialTargets.targets.kcal,
      `day ${checkInDay} must not lower the target because of the event`,
    ).toBeGreaterThanOrEqual(initialTargets.targets.kcal);
  }

  const recentEvent = analyze({
    setup: setup(),
    weights: logs.weights,
    intake: logs.intake,
    today: start.addDays(56),
    weightEvents: [{ date: start.addDays(54), type: 'startedCreatine' }],
  }) as CoachSnapshot;
  expect(recentEvent.confidence.stability).not.toBe('good');
});

it('a declared three-day travel water rise moves the trend less', () => {
  const event: WeightEvent = { date: start.addDays(20), type: 'travel' };
  const observations: WeightObservation[] = upTo(42).map((day) => ({
    date: start.addDays(day),
    weightKg: 80 + (day >= 21 && day <= 23 ? 1.2 : 0),
  }));
  const model = new WeightTrendModel();
  const withoutEvent = model.smooth(observations);
  const withEvent = model.smooth(observations, {
    noiseMultiplier: passingWeightEventNoise(effectiveWeightEvents([event])),
  });
  expect((withEvent[23] as WeightTrendPoint).levelKg).toBeLessThan((withoutEvent[23] as WeightTrendPoint).levelKg);
});

it('a retrospective creatine event recomputes trend and expenditure', () => {
  const logs = simulate(new SyntheticUser({ seed: 314, start, baseTdeeKcal: 2800 }), { days: 56, loggedKcal: 2300 });
  const eventOn = start.addDays(42);
  const observations = withStep(logs.weights, eventOn, 1.5);
  const snapshot = (events: WeightEvent[]) =>
    analyze({
      setup: setup(),
      weights: observations,
      intake: logs.intake,
      today: start.addDays(56),
      weightEvents: events,
    }) as CoachSnapshot;
  const was = snapshot([]);
  const now = snapshot([{ date: eventOn, type: 'startedCreatine' }]);
  const at = eventOn.epochDay - start.epochDay;
  expect((now.trend[at] as WeightTrendPoint).levelKg).not.toBe((was.trend[at] as WeightTrendPoint).levelKg);
  expect(now.tdee.kcal).not.toBe(was.tdee.kcal);
  expect(now.tdee.weighIns).toBeLessThan(was.tdee.weighIns);
  expect(now.tdee.usableIntakeDays).toBeLessThan(was.tdee.usableIntakeDays);
});

const creatineTypes: WeightEventType[] = ['startedCreatine', 'stoppedCreatine'];
for (const type of creatineTypes) {
  it(`${type} resumes measured expenditure after settling`, () => {
    const logs = simulate(new SyntheticUser({ seed: 314, start, baseTdeeKcal: 2800 }), {
      days: 84,
      loggedKcal: 2300,
    });
    const direction = type === 'startedCreatine' ? 1 : -1;
    const observations = withStep(logs.weights, creatineStartedOn, direction * 1.5);
    const baseline = analyze({
      setup: setup(),
      weights: logs.weights,
      intake: logs.intake,
      today: start.addDays(84),
    }) as CoachSnapshot;
    const declared = analyze({
      setup: setup(),
      weights: observations,
      intake: logs.intake,
      today: start.addDays(84),
      weightEvents: [{ date: creatineStartedOn, type }],
    }) as CoachSnapshot;
    expect(declared.tdee.status).toBe('updated');
    expect(Math.abs(declared.tdee.kcal - baseline.tdee.kcal)).toBeLessThan(100);
    expect(declared.confidence.stability).toBe('good');
  });
}
