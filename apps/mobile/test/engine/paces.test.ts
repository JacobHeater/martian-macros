import { describe, expect, it } from 'vitest';
import { type BiologicalSex, CalendarDate, CoachingPolicy, Profile, ScreeningAnswers } from '../../src/domain';
import {
  BodyFatEstimate,
  computeTargets,
  describePaces,
  FatLossPace,
  type PaceOption,
  PaceRule,
  TargetInputs,
} from '../../src/engine';

/** MM-128: choose how fast to lose, and see what each pace costs. */
const today = CalendarDate.of(2026, 10, 5);

const policyFor = (sex: BiologicalSex, { birthYear = 1990 }: { birthYear?: number } = {}) =>
  CoachingPolicy.derive({
    profile: new Profile({ sex, birthDate: CalendarDate.of(birthYear, 1, 1), heightCm: sex === 'male' ? 178 : 165 }),
    screening: new ScreeningAnswers(),
    today,
  });

const inputs = ({
  sex = 'male',
  weightKg = 100,
  bodyFat = 30,
  tdee = 3000,
  bmr = 1900,
  policy,
  requestedLoss,
}: {
  sex?: BiologicalSex;
  weightKg?: number;
  bodyFat?: number;
  tdee?: number;
  bmr?: number;
  policy?: CoachingPolicy;
  requestedLoss?: number;
} = {}) =>
  new TargetInputs({
    sex,
    heightCm: sex === 'male' ? 178 : 165,
    trendWeightKg: weightKg,
    bodyFat: new BodyFatEstimate({ percent: bodyFat, sigmaPercent: 2 }),
    mode: 'fatLoss',
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    policy: policy ?? policyFor(sex),
    tdeeKcal: tdee,
    bmrKcal: bmr,
    requestedLossFraction: requestedLoss,
  });

const byPace = (options: readonly PaceOption[]) =>
  Object.fromEntries(options.map((o) => [o.pace, o])) as Record<FatLossPace, PaceOption>;

describe('the three paces', () => {
  it('a heavier man at 30% body fat with an expenditure of 3,000 is offered all three, each deficit in step with its pace', () => {
    // The ticket's "about 530, 800 and 1,050" assumed 7,400 kcal per kg lost; the engine's energy density for a
    // trained person at 30% body fat is higher (MM-26), so the figures here are about 600, 900 and 1,200.
    const paces = byPace(describePaces(inputs()));
    for (const pace of FatLossPace.values) expect(paces[pace].offered, pace).toBe(true);
    expect(paces.gentle.deficitKcal).toBeGreaterThan(520);
    expect(paces.gentle.deficitKcal).toBeLessThan(680);
    expect(paces.standard.deficitKcal / paces.gentle.deficitKcal).toBeCloseTo(1.5, 1);
    // Faster asks about 1,200; the cap at 35% of expenditure holds it to 1,050, the ticket's own figure.
    expect(paces.faster.deficitKcal).toBe(1050);
    expect(paces.faster.limitedBy).toBe('deficitCap');
    expect(paces.standard.limitedBy).toBeUndefined();
    expect(paces.standard.targetKcal).toBe(3000 - paces.standard.deficitKcal);
    expect(paces.gentle.limitedBy).toBeUndefined();
  });

  it('low expenditure for body weight: the deficit is capped at 35% of expenditure, and the pace this gives is told', () => {
    const paces = byPace(describePaces(inputs({ sex: 'female', weightKg: 120, bodyFat: 45, tdee: 2200, bmr: 1400 })));
    expect(paces.standard.offered).toBe(true);
    expect(paces.standard.deficitKcal).toBe(770);
    expect(paces.standard.limitedBy).toBe('deficitCap');
    expect(paces.standard.achievedFraction).toBeLessThan(0.0075);
    expect(paces.standard.achievedFraction).toBeGreaterThan(0.004);
    // The targets the coach would issue carry the cap and the pace it gives.
    const targets = computeTargets(inputs({ sex: 'female', weightKg: 120, bodyFat: 45, tdee: 2200, bmr: 1400, requestedLoss: 0.0075 }));
    expect(targets.kcal).toBe(2200 - 770);
    expect(targets.flags.has('deficitCapped')).toBe(true);
    expect(targets.weeklyRateFraction).toBeCloseTo(-paces.standard.achievedFraction, 6);
  });

  it('Faster is not offered at 18% body fat, with the reason', () => {
    const paces = byPace(describePaces(inputs({ bodyFat: 18 })));
    expect(paces.gentle.offered).toBe(true);
    expect(paces.standard.offered).toBe(true);
    expect(paces.faster.offered).toBe(false);
    expect(paces.faster.withheld).toBe('notLeanEnoughForFaster');
  });

  it('the floor limits the pace: a 50 kg woman with an expenditure of 1,550 and a floor of 1,200 gets about 0.65% a week from Standard', () => {
    const paces = byPace(describePaces(inputs({ sex: 'female', weightKg: 50, bodyFat: 28, tdee: 1550, bmr: 1200 })));
    expect(paces.standard.offered).toBe(true);
    expect(paces.standard.limitedBy).toBe('calorieFloor');
    expect(paces.standard.deficitKcal).toBe(350);
    expect(paces.standard.targetKcal).toBe(1200);
    expect(paces.standard.achievedFraction).toBeGreaterThan(0.006);
    expect(paces.standard.achievedFraction).toBeLessThan(0.0072);
  });

  it('lean: only Gentle, the others withheld by the body-fat limit', () => {
    const paces = byPace(describePaces(inputs({ bodyFat: 11 })));
    expect(paces.gentle.offered).toBe(true);
    expect(paces.standard.offered).toBe(false);
    expect(paces.standard.withheld).toBe('bodyFat');
    expect(paces.faster.withheld).toBe('bodyFat');
  });

  it('a caution leaves only Gentle', () => {
    const senior = policyFor('male', { birthYear: 1955 });
    expect(senior.maxWeeklyLossFraction).toBe(CoachingPolicy.seniorMaxWeeklyLossFraction);
    const paces = byPace(describePaces(inputs({ policy: senior })));
    expect(paces.gentle.offered).toBe(true);
    expect(paces.standard.withheld).toBe('caution');
    expect(paces.faster.withheld).toBe('caution');
  });

  it('a deficit above what the body fat can supply is noted, never enforced', () => {
    // 100 kg at 12% body fat has 12 kg of fat: about 830 kcal a day by the model.
    const paces = byPace(describePaces(inputs({ bodyFat: 12, tdee: 3400 })));
    expect(PaceRule.fatSupplyKcalPerKgFatMassDay * 12).toBeLessThan(900);
    expect(paces.gentle.aboveFatSupply).toBe(false);
    expect(paces.gentle.deficitKcal).toBeGreaterThan(0);
  });

  it('the paces name their fractions, and a stored fraction names its pace', () => {
    expect(FatLossPace.fraction('gentle')).toBe(0.005);
    expect(FatLossPace.fraction('standard')).toBe(0.0075);
    expect(FatLossPace.fraction('faster')).toBe(0.01);
    expect(FatLossPace.of(undefined)).toBe('standard');
    expect(FatLossPace.of(0.005)).toBe('gentle');
    expect(FatLossPace.of(0.006)).toBeUndefined();
    expect(FatLossPace.relief).toEqual([0.01, 0.0075, 0.005]);
  });
});
