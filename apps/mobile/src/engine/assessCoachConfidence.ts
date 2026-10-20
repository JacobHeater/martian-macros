import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import { CoachConfidence } from './CoachConfidence';
import {
  confidenceGoodEstimateSigmaKcal,
  confidenceGoodFoodDays,
  confidenceGoodWeighInDays,
  confidenceLearningEstimateSigmaKcal,
  confidenceMinimumFoodDays,
  confidenceMinimumWeighInDays,
  confidenceStabilityDays,
} from './confidenceConstants';
import type { ConfidenceLevel } from './ConfidenceLevel';
import type { ConfidenceNextStep } from './ConfidenceNextStep';
import { settlingWindows } from './settlingWindows';
import type { TargetsRecord } from './TargetsRecord';
import type { TdeeEstimate } from './TdeeEstimate';
import { TdeeEstimator } from './TdeeEstimator';
import type { WeightTrendPoint } from './WeightTrendPoint';

/** Classifies the current estimate using the MM-139 boundaries. */
export function assessCoachConfidence({
  estimate,
  asOf,
  intake,
  trend,
  history,
  lastWeightEventOn,
  lastGapEndedOn,
}: {
  estimate: TdeeEstimate;
  asOf: CalendarDate;
  intake: Iterable<IntakeDay>;
  trend: Iterable<WeightTrendPoint>;
  history: readonly TargetsRecord[];
  lastWeightEventOn?: CalendarDate | undefined;
  /** The last day of the most recent gap (MM-147): confidence is at most Fair until the window has refilled past it. */
  lastGapEndedOn?: CalendarDate | undefined;
}): CoachConfidence {
  const estimator = new TdeeEstimator();
  const start = asOf.addDays(1 - estimator.windowDays);
  const usableFoodDays = estimator.countUsableIntakeDays({ intake, start, end: asOf });
  const weighInDays = [...trend].filter(
    (point) => point.observed && !point.date.isBefore(start) && !point.date.isAfter(asOf),
  ).length;

  const estimateLevel: ConfidenceLevel =
    estimate.status !== 'updated' || estimate.sigmaKcal > confidenceLearningEstimateSigmaKcal
      ? 'learning'
      : estimate.sigmaKcal < confidenceGoodEstimateSigmaKcal
        ? 'good'
        : 'fair';
  const foodLevel: ConfidenceLevel =
    usableFoodDays >= confidenceGoodFoodDays
      ? 'good'
      : usableFoodDays >= confidenceMinimumFoodDays
        ? 'fair'
        : 'learning';
  const weighInLevel: ConfidenceLevel =
    weighInDays >= confidenceGoodWeighInDays
      ? 'good'
      : weighInDays >= confidenceMinimumWeighInDays
        ? 'fair'
        : 'learning';

  const recentStart = asOf.addDays(1 - confidenceStabilityDays);
  const recentPhaseChange = settlingWindows(history).some(
    (window) => !window.start.isAfter(asOf) && !window.end.isBefore(recentStart),
  );
  const restart = estimate.styleRestartOn;
  const recentStyleRestart = restart !== undefined && !restart.isBefore(recentStart) && !restart.isAfter(asOf);
  const recentWeightEvent =
    lastWeightEventOn !== undefined && !lastWeightEventOn.isBefore(recentStart) && !lastWeightEventOn.isAfter(asOf);
  // A gap inside the estimator's window: the window has not refilled, so the coach is at most Fair (MM-147).
  const recentGap = lastGapEndedOn !== undefined && !lastGapEndedOn.isBefore(start) && !lastGapEndedOn.isAfter(asOf);
  const stabilityLevel: ConfidenceLevel = estimate.clampedToBounds
    ? 'learning'
    : recentPhaseChange || recentStyleRestart || recentWeightEvent || recentGap
      ? 'fair'
      : 'good';

  const levels = [estimateLevel, foodLevel, weighInLevel, stabilityLevel];
  const level: ConfidenceLevel = levels.includes('learning') ? 'learning' : levels.includes('fair') ? 'fair' : 'good';
  const nextStep = nextStepFor({
    estimate,
    estimateLevel,
    foodLevel,
    weighInLevel,
    stabilityLevel,
    usableFoodDays,
    weighInDays,
  });
  return new CoachConfidence({
    level,
    estimate: estimateLevel,
    foodLog: foodLevel,
    weighIns: weighInLevel,
    stability: stabilityLevel,
    nextStep,
    usableFoodDays,
    weighInDays,
  });
}

function nextStepFor({
  estimate,
  estimateLevel,
  foodLevel,
  weighInLevel,
  stabilityLevel,
  usableFoodDays,
  weighInDays,
}: {
  estimate: TdeeEstimate;
  estimateLevel: ConfidenceLevel;
  foodLevel: ConfidenceLevel;
  weighInLevel: ConfidenceLevel;
  stabilityLevel: ConfidenceLevel;
  usableFoodDays: number;
  weighInDays: number;
}): ConfidenceNextStep {
  if (estimate.clampedToBounds) return 'reviewFoodLogging';
  if (estimate.settlingUntil !== undefined || stabilityLevel === 'fair') {
    return 'waitForStability';
  }
  if (foodLevel === 'learning' || (estimate.status === 'held' && usableFoodDays < confidenceMinimumFoodDays)) {
    return 'completeFoodLog';
  }
  if (weighInLevel === 'learning' || weighInDays < confidenceGoodWeighInDays) {
    return 'recordWeight';
  }
  if (estimateLevel !== 'good') {
    return 'keepLogging';
  }
  if (foodLevel === 'fair') {
    return 'completeFoodLog';
  }
  if (weighInLevel === 'fair') {
    return 'recordWeight';
  }
  return 'keepLogging';
}
