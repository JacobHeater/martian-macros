import { expect, it } from 'vitest';
import { CalendarDate, IntakeDay } from '../../src/domain';
import {
  assessCoachConfidence,
  DailyTargets,
  TargetsExplanation,
  TargetsRecord,
  TdeeEstimate,
  type TdeeStatus,
  WeightTrendPoint,
} from '../../src/engine';
import { upTo } from '../support/upTo';

const asOf = CalendarDate.of(2026, 10, 5);

const intakeDays = (count: number) =>
  upTo(count).map(
    (day) =>
      new IntakeDay({
        date: asOf.addDays(-day),
        kcal: 2000,
        proteinG: 120,
        carbsG: 200,
        fatG: 60,
        completeness: 'complete',
      }),
  );

const trendDays = (count: number) =>
  upTo(count).map(
    (day) =>
      new WeightTrendPoint({
        date: asOf.addDays(-day),
        levelKg: 80,
        slopeKgPerDay: 0,
        waterKg: 0,
        levelVariance: 0.01,
        slopeVariance: 0.0001,
        observed: true,
        rejected: false,
      }),
  );

const estimate = ({
  sigma = 170,
  status = 'updated',
  clamped = false,
  settlingUntil,
  styleRestartOn,
}: {
  sigma?: number;
  status?: TdeeStatus;
  clamped?: boolean;
  settlingUntil?: CalendarDate;
  styleRestartOn?: CalendarDate;
} = {}) =>
  new TdeeEstimate({ kcal: 2500, sigmaKcal: sigma, status, clampedToBounds: clamped, settlingUntil, styleRestartOn });

const assess = ({
  tdee,
  foods = 24,
  weighIns = 25,
  history = [],
  weightEventOn,
  gapEndedOn,
}: {
  tdee?: TdeeEstimate;
  foods?: number;
  weighIns?: number;
  history?: readonly TargetsRecord[];
  weightEventOn?: CalendarDate;
  gapEndedOn?: CalendarDate;
} = {}) =>
  assessCoachConfidence({
    estimate: tdee ?? estimate(),
    asOf,
    intake: intakeDays(foods),
    trend: trendDays(weighIns),
    history,
    lastWeightEventOn: weightEventOn,
    lastGapEndedOn: gapEndedOn,
  });

it('good measurements and complete recent data produce Good', () => {
  const confidence = assess();
  expect(confidence.level).toBe('good');
  expect(confidence.estimate).toBe('good');
  expect(confidence.foodLog).toBe('good');
  expect(confidence.weighIns).toBe('good');
  expect(confidence.stability).toBe('good');
});

it('confidence boundaries are inclusive at 200 and 350 kcal', () => {
  expect(assess({ tdee: estimate({ sigma: 199.9 }) }).estimate).toBe('good');
  expect(assess({ tdee: estimate({ sigma: 200 }) }).estimate).toBe('fair');
  expect(assess({ tdee: estimate({ sigma: 350 }) }).estimate).toBe('fair');
  expect(assess({ tdee: estimate({ sigma: 350.1 }) }).estimate).toBe('learning');
});

it('one weak data part determines the level and next step', () => {
  const confidence = assess({ weighIns: 9 });
  expect(confidence.level).toBe('fair');
  expect(confidence.weighIns).toBe('fair');
  expect(confidence.nextStep).toBe('recordWeight');
});

it('a new user gets a specific food logging next step', () => {
  const confidence = assess({ tdee: estimate({ status: 'held' }), foods: 5, weighIns: 5 });
  expect(confidence.level).toBe('learning');
  expect(confidence.nextStep).toBe('completeFoodLog');
});

it('food logging wins a tie with weigh-ins for the next step', () => {
  const confidence = assess({ tdee: estimate({ status: 'held' }), foods: 6, weighIns: 5 });
  expect(confidence.foodLog).toBe('learning');
  expect(confidence.weighIns).toBe('learning');
  expect(confidence.nextStep).toBe('completeFoodLog');
});

it('a recent phase change makes stability Fair', () => {
  const changedOn = asOf.addDays(-6);
  const history = [
    new TargetsRecord({
      effectiveFrom: changedOn,
      mode: 'maintenance',
      tdeeKcal: 2500,
      tdeeSigmaKcal: 170,
      tdeeStatus: 'updated',
      targets: new DailyTargets({ kcal: 1900, proteinG: 150, fatG: 65, carbsG: 180, weeklyRateFraction: 0 }),
    }),
  ];
  const confidence = assess({ history });
  expect(confidence.level).toBe('fair');
  expect(confidence.stability).toBe('fair');
  expect(confidence.nextStep).toBe('waitForStability');
});

it('a gap inside the window makes stability Fair until the window has refilled past it (MM-147)', () => {
  const afterGap = assess({ gapEndedOn: asOf.addDays(-10) });
  expect(afterGap.stability).toBe('fair');
  expect(afterGap.level).toBe('fair');
  expect(afterGap.nextStep).toBe('waitForStability');
  // A gap that ended before the window began has left it.
  expect(assess({ gapEndedOn: asOf.addDays(-40) }).stability).toBe('good');
});

it('a recent style restart makes stability Fair', () => {
  const confidence = assess({ tdee: estimate({ styleRestartOn: asOf.addDays(-10) }) });
  expect(confidence.stability).toBe('fair');
  expect(confidence.nextStep).toBe('waitForStability');
});

it('an estimate clamped to a limit is Learning and flags the food log', () => {
  const confidence = assess({ tdee: estimate({ clamped: true }) });
  expect(confidence.level).toBe('learning');
  expect(confidence.stability).toBe('learning');
  expect(confidence.nextStep).toBe('reviewFoodLogging');
});

it('recent weight events lower stability', () => {
  const confidence = assess({ weightEventOn: asOf.addDays(-2) });
  expect(confidence.stability).toBe('fair');
  expect(confidence.nextStep).toBe('waitForStability');
});

it('confidence can be stored in target explanation JSON', () => {
  const confidence = assess();
  const explanation = new TargetsExplanation({ lines: [], newKcal: 2200, estimateStatus: 'updated' });
  const withConfidence = new TargetsExplanation({
    lines: explanation.lines,
    newKcal: explanation.newKcal,
    estimateStatus: explanation.estimateStatus,
    confidence,
  });
  const restored = TargetsExplanation.decode(withConfidence.encode());
  expect(restored.confidence?.level).toBe('good');
  expect(restored.confidence?.usableFoodDays).toBe(24);
  expect(restored.confidence?.weighInDays).toBe(25);
});
