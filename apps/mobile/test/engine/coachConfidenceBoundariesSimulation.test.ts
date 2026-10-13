import { describe, expect, it } from 'vitest';
import {
  assessCoachConfidence,
  type CoachConfidence,
  type ConfidenceNextStep,
  energyDensityForSlope,
  TdeeEstimator,
  type TdeePrior,
  WeightTrendModel,
} from '../../src/engine';
import { simulate } from './support/simulate';
import { SyntheticUser } from './support/SyntheticUser';

/**
 * MM-139: the data boundaries and the next-step priority, validated on a
 * population rather than on constructed snapshots. Each case runs a hundred
 * deterministic users for eight weeks with one logging habit, and asks what
 * the coach would say to most of them. The unit tests pin the exact
 * boundaries; this pins that real logging habits land on the intended side
 * of them and that the one next step named is the part worth fixing first.
 */
const estimator = new TdeeEstimator();
const trendModel = new WeightTrendModel();
const prior: TdeePrior = { kcal: 2500, sigmaKcal: 375 };
const trials = 100;

function confidenceOf(seed: number, habit: { skipWeighInProbability?: number; skipLogProbability?: number }): CoachConfidence {
  const user = new SyntheticUser({ seed, baseTdeeKcal: 2800, ...habit });
  const logs = simulate(user, { days: 56, loggedKcal: 2200 });
  const asOf = user.today.addDays(-1);
  const trend = trendModel.smooth(logs.weights, { through: asOf });
  const estimate = estimator.estimate({
    asOf,
    intake: logs.intake,
    trend,
    prior,
    bmrKcal: 1850,
    energyDensityForSlope: (slope) =>
      energyDensityForSlope({ slopeKgPerDay: slope, fatMassKg: user.fatMassKg, resistanceTrained: true }),
  });
  return assessCoachConfidence({ estimate, asOf, intake: logs.intake, trend, history: [] });
}

/** How many of a hundred users share `nextStep`, and the levels they land on. */
function population(habit: { skipWeighInProbability?: number; skipLogProbability?: number }) {
  const steps = new Map<ConfidenceNextStep, number>();
  const levels = new Map<string, number>();
  let weighIns = 0;
  let foodDays = 0;
  for (let seed = 200; seed < 200 + trials; seed++) {
    const confidence = confidenceOf(seed, habit);
    steps.set(confidence.nextStep, (steps.get(confidence.nextStep) ?? 0) + 1);
    levels.set(confidence.level, (levels.get(confidence.level) ?? 0) + 1);
    weighIns += confidence.weighInDays;
    foodDays += confidence.usableFoodDays;
  }
  const describe = `steps ${JSON.stringify([...steps])}, levels ${JSON.stringify([...levels])}, mean weigh-ins ${weighIns / trials}, mean usable food days ${foodDays / trials}`;
  return { step: (name: ConfidenceNextStep) => steps.get(name) ?? 0, level: (name: string) => levels.get(name) ?? 0, describe };
}

describe('the confidence next step, on a population', () => {
  it('someone who rarely weighs in is told to record their weight, and is never Good', () => {
    const p = population({ skipWeighInProbability: 0.75 });
    expect(p.step('recordWeight'), p.describe).toBeGreaterThanOrEqual(90);
    expect(p.level('good'), p.describe).toBe(0);
  });

  it('someone who weighs in half the time is Fair, and told to record their weight', () => {
    // About fourteen weigh-ins in the window: Fair's band is 8 to 19. A few
    // land on twenty by chance and are rightly Good; the boundary counts.
    const p = population({ skipWeighInProbability: 0.5 });
    expect(p.step('recordWeight'), p.describe).toBeGreaterThanOrEqual(90);
    expect(p.level('fair'), p.describe).toBeGreaterThanOrEqual(85);
    expect(p.level('good'), p.describe).toBeLessThanOrEqual(5);
  });

  it('someone who rarely logs food is told to complete the food log first', () => {
    const p = population({ skipLogProbability: 0.7 });
    expect(p.step('completeFoodLog'), p.describe).toBeGreaterThanOrEqual(90);
    expect(p.level('good'), p.describe).toBe(0);
  });

  it('when both the food log and the weigh-ins are Learning, the food log comes first', () => {
    const p = population({ skipLogProbability: 0.8, skipWeighInProbability: 0.75 });
    expect(p.step('completeFoodLog'), p.describe).toBeGreaterThanOrEqual(90);
    expect(p.level('learning'), p.describe).toBeGreaterThanOrEqual(95);
  });

  it('a Fair food log beside Learning weigh-ins names the weigh-ins: the weakest part first, before the tie rule', () => {
    const p = population({ skipLogProbability: 0.5, skipWeighInProbability: 0.75 });
    expect(p.step('recordWeight'), p.describe).toBeGreaterThanOrEqual(70);
    expect(p.step('completeFoodLog') + p.step('recordWeight'), p.describe).toBe(100);
  });

  it('someone who logs and weighs in daily is mostly Good and told only to keep going', () => {
    const p = population({});
    expect(p.level('good'), p.describe).toBeGreaterThanOrEqual(70);
    expect(p.step('keepLogging'), p.describe).toBeGreaterThanOrEqual(70);
    expect(p.step('completeFoodLog') + p.step('recordWeight'), p.describe).toBeLessThanOrEqual(30);
  });
});
