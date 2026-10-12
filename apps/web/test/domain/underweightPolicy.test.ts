import { expect, it } from 'vitest';
import {
  type BiologicalSex,
  bodyMassIndex,
  CalendarDate,
  CoachingPolicy,
  GoalMode,
  Profile,
  ScreeningAnswers,
  UserSetup,
} from '../../src/domain';
import { expectClose } from '../support/expectClose';

/** MM-111: never coach an underweight user into a deficit. */
const today = CalendarDate.of(2026, 10, 5);

const policy = ({
  sex,
  heightCm,
  weightKg,
  screening = new ScreeningAnswers(),
}: {
  sex: BiologicalSex;
  heightCm: number;
  weightKg?: number;
  screening?: ScreeningAnswers;
}) =>
  CoachingPolicy.derive({
    profile: new Profile({ sex, birthDate: CalendarDate.of(1990, 1, 1), heightCm }),
    screening,
    today,
    weightKg,
  });

it('body mass index is weight over height squared', () => {
  expectClose(bodyMassIndex({ weightKg: 50, heightCm: 170 }), 17.3, 0.01);
  expectClose(bodyMassIndex({ weightKg: 63, heightCm: 180 }), 19.44, 0.01);
});

it('a 170 cm woman at 50 kg is offered maintenance and lean gain only', () => {
  const p = policy({ sex: 'female', heightCm: 170, weightKg: 50 });
  expect(p.underweight).toBe(true);
  expect(p.allowedModes).toEqual(new Set(['maintenance', 'leanGain']));
  expect(p.cautions).toContain('underweight');
});

it('in the caution zone a deficit is allowed but only at 0.5% a week', () => {
  // 180 cm and 63 kg is BMI 19.4.
  const p = policy({ sex: 'male', heightCm: 180, weightKg: 63 });
  expect(p.underweight).toBe(false);
  expect(p.allowedModes).toEqual(new Set(GoalMode.values));
  expect(p.maxWeeklyLossFraction).toBe(0.005);
  expect(p.cautions).toContain('lowBodyWeight');
  expect(p.cautions).not.toContain('underweight');
});

it('the thresholds are 18.5 and 20', () => {
  // At 180 cm, BMI 18.5 is 59.94 kg and BMI 20 is 64.8 kg.
  const at = (kg: number) => policy({ sex: 'male', heightCm: 180, weightKg: kg });
  expect(at(59.9).underweight).toBe(true);
  expect(at(60.0).underweight).toBe(false);
  expect(at(60.0).maxWeeklyLossFraction).toBe(0.005);
  expect(at(64.7).maxWeeklyLossFraction).toBe(0.005);
  expect(at(64.9).maxWeeklyLossFraction).toBeUndefined();
  expect(at(64.9).cautions.size).toBe(0);
});

it('at BMI 24 this rule changes nothing', () => {
  const p = policy({ sex: 'male', heightCm: 180, weightKg: 78 });
  expect(p.underweight).toBe(false);
  expect(p.maxWeeklyLossFraction).toBeUndefined();
  expect(p.allowedModes).toEqual(new Set(GoalMode.values));
  expect(p.cautions.size).toBe(0);
});

it('with no weight given, nothing changes', () => {
  const p = policy({ sex: 'female', heightCm: 170 });
  expect(p.underweight).toBe(false);
  expect(p.allowedModes).toEqual(new Set(GoalMode.values));
});

it('it combines with the other rules and never widens them', () => {
  const ed = policy({
    sex: 'female',
    heightCm: 170,
    weightKg: 50,
    screening: new ScreeningAnswers({ eatingDisorderHistory: true }),
  });
  expect(ed.allowedModes).toEqual(new Set(['maintenance', 'leanGain']));
  const pregnant = policy({
    sex: 'female',
    heightCm: 170,
    weightKg: 50,
    screening: new ScreeningAnswers({ pregnant: true }),
  });
  expect(pregnant.allowedModes).toEqual(new Set(['maintenance']));
});

it('age and insulin treatment set policy limits and protein floor', () => {
  const older = new Profile({ sex: 'male', birthDate: CalendarDate.of(1960, 1, 1), heightCm: 170 });
  const p = CoachingPolicy.derive({
    profile: older,
    screening: new ScreeningAnswers({ insulinOrSulfonylurea: true }),
    today,
    weightKg: 80,
  });
  expect(p.maxWeeklyLossFraction).toBe(0.005);
  expect(p.minimumProteinGPerKgReferenceWeight).toBe(1.2);
  expect(p.cautions).toContain('insulinOrSulfonylurea');
});

it('age-based policy starts on the sixty-fifth birthday', () => {
  const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(1961, 10, 6), heightCm: 170 });
  const derive = (date: CalendarDate) =>
    CoachingPolicy.derive({ profile, screening: new ScreeningAnswers(), today: date, weightKg: 80 });
  const dayBefore = derive(CalendarDate.of(2026, 10, 5));
  expect(dayBefore.maxWeeklyLossFraction).toBeUndefined();
  expect(dayBefore.minimumProteinGPerKgReferenceWeight).toBeUndefined();
  const birthday = derive(CalendarDate.of(2026, 10, 6));
  expect(birthday.maxWeeklyLossFraction).toBe(0.005);
  expect(birthday.minimumProteinGPerKgReferenceWeight).toBe(1.2);
});

it('a confirmed care-team discussion removes the insulin pace limit', () => {
  const p = CoachingPolicy.derive({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 170 }),
    screening: new ScreeningAnswers({ insulinOrSulfonylurea: true, insulinCareTeamConfirmed: true }),
    today,
    weightKg: 80,
  });
  expect(p.maxWeeklyLossFraction).toBeUndefined();
});

it('bariatric surgery disables targets without blocking the app', () => {
  const p = CoachingPolicy.derive({
    profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 170 }),
    screening: new ScreeningAnswers({ bariatricSurgery: true }),
    today,
    weightKg: 80,
  });
  expect(p.blocked).toBe(false);
  expect(p.targetsAllowed).toBe(false);
  expect(p.cautions).toContain('bariatricSurgery');
});

it('weight-affecting medication adds a caution without blocking', () => {
  const p = policy({
    sex: 'male',
    heightCm: 180,
    screening: new ScreeningAnswers({ weightAffectingMedication: true }),
  });
  expect(p.blocked).toBe(false);
  expect(p.targetsAllowed).toBe(true);
  expect(p.cautions).toContain('weightAffectingMedication');
});

it('health check becomes due on the ninetieth day', () => {
  const setup = new UserSetup({
    profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 170 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'novice',
    trainingDaysPerWeek: 3,
    goalMode: 'maintenance',
    onboardedOn: CalendarDate.of(2026, 1, 1),
    healthCheckConfirmedOn: CalendarDate.of(2026, 1, 1),
  });
  expect(setup.healthCheckDueOn(CalendarDate.of(2026, 3, 31))).toBe(false);
  expect(setup.healthCheckDueOn(CalendarDate.of(2026, 4, 1))).toBe(true);
});

// Not in the Dart tests: Dart cleared a field with a function returning
// null; here the key is given with undefined, and an absent key keeps it.
it('copyWith keeps what is not named and clears what is named undefined', () => {
  const setup = new UserSetup({
    profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 170 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'novice',
    trainingDaysPerWeek: 3,
    goalMode: 'maintenance',
    onboardedOn: CalendarDate.of(2026, 1, 1),
    bodyFatPercent: 28,
    requestedLossFraction: 0.005,
  });
  const kept = setup.copyWith({ goalMode: 'fatLoss' });
  expect(kept.goalMode).toBe('fatLoss');
  expect(kept.bodyFatPercent).toBe(28);
  expect(kept.requestedLossFraction).toBe(0.005);
  const cleared = setup.copyWith({ bodyFatPercent: undefined });
  expect(cleared.bodyFatPercent).toBeUndefined();
  expect(cleared.requestedLossFraction).toBe(0.005);
});
