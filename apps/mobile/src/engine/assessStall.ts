import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { UserSetup } from '../domain/UserSetup';
import type { WaistObservation } from '../domain/WaistObservation';
import type { WeightEvent } from '../domain/WeightEvent';
import type { WeightObservation } from '../domain/WeightObservation';
import type { Workout } from '../domain/training/Workout';
import { clamp } from '../lang/clamp';
import type { CoachSnapshot } from './CoachSnapshot';
import { effectiveWeightEvents } from './effectiveWeightEvents';
import { SafetyBounds } from './SafetyBounds';
import { shortSleep } from './shortSleep';
import type { SleepAverage } from './SleepAverage';
import { StallAssessment } from './StallAssessment';
import type { StallDiagnosis } from './StallDiagnosis';
import type { StallNotAssessedReason } from './StallNotAssessedReason';
import { StallRule } from './StallRule';
import { summarizeAdherence } from './summarizeAdherence';
import type { TargetsRecord } from './TargetsRecord';
import { trainingStartOn } from './trainingStartOn';
import { waistChangeOf } from './waistChangeOf';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * Whether progress has stalled against the goal and, if so, which kind of
 * stall it is (MM-140).
 *
 * A stall is defined against the goal, not against zero: over the window the
 * trend moved less than a third of the intended pace, and the shortfall is
 * larger than the slope's own uncertainty. The diagnosis is the first that
 * applies of: thin data, masked by water (the waist down, a passing event,
 * or training started in the last days), intake off target, and the
 * estimate being wrong. Sleep that averaged short is recorded beside the
 * diagnosis (MM-252), whichever it is, as a cause the person can act on.
 * Intake is judged as the adherence summary judges it, a shaped week against
 * its plan (MM-124, `plannedShare`). Nothing here changes a target.
 */
export function assessStall({
  setup,
  snapshot,
  history,
  intake,
  weights,
  today,
  waist = [],
  weightEvents = [],
  workouts = [],
  hasCycleData = false,
  sleepAverage,
  plannedShare,
}: {
  setup: UserSetup;
  snapshot: CoachSnapshot;
  history: readonly TargetsRecord[];
  intake: readonly IntakeDay[];
  weights: readonly WeightObservation[];
  today: CalendarDate;
  waist?: readonly WaistObservation[];
  weightEvents?: readonly WeightEvent[];
  /** The training log, for training that started in the last days of the window. */
  workouts?: readonly Workout[];
  hasCycleData?: boolean;
  /** The fourteen-night average from the nights recorded (MM-250); undefined with none. */
  sleepAverage?: SleepAverage | undefined;
  /** The share of the flat figure planned for each day (MM-124); every day flat without it. */
  plannedShare?: ((date: CalendarDate) => number) | undefined;
}): StallAssessment {
  const window =
    setup.profile.sex === 'female' && !hasCycleData ? StallRule.windowDaysWithoutCycleData : StallRule.windowDays;
  const skip = (reason: StallNotAssessedReason) => StallAssessment.notAssessed(reason, { windowDays: window });

  const current = history[history.length - 1];
  if (current === undefined) return skip('noPaceToMeet');
  const rate = current.targets.weeklyRateFraction;
  if (rate === 0) return skip('noPaceToMeet');
  const gaining = rate > 0;

  // The phase began with the first of the trailing targets that share this
  // direction, or on the first day back from a long gap.
  let phaseStart = current.effectiveFrom;
  for (let i = history.length - 1; i >= 0; i--) {
    const record = history[i] as TargetsRecord;
    if (Math.sign(record.targets.weeklyRateFraction) !== Math.sign(rate)) break;
    phaseStart = record.effectiveFrom;
  }
  const restart = snapshot.deficitRestartOn;
  if (restart !== undefined && restart.isAfter(phaseStart)) phaseStart = restart;
  if (phaseStart.daysUntil(today) < window) {
    return skip('earlyInPhase');
  }
  if (snapshot.confidence.level === 'learning') {
    return skip('lowConfidence');
  }
  const lasting = snapshot.lastCreatineEventOn;
  if (lasting !== undefined && !lasting.isAfter(today) && lasting.daysUntil(today) < StallRule.lastingEventDays) {
    return skip('recentLastingEvent');
  }

  const through = today.addDays(-1);
  const from = through.addDays(-window);
  const points = new Map<CalendarDate, WeightTrendPoint>();
  for (const p of snapshot.trend) points.set(p.date, p);
  const start = points.get(from);
  const end = points.get(through);
  if (start === undefined || end === undefined) {
    return skip('notEnoughTrend');
  }

  const slopePerDay = (end.levelKg - start.levelKg) / window;
  const slopeSigma = Math.sqrt(start.levelVariance + end.levelVariance) / window;
  const intendedPerDay = (rate * snapshot.trendWeightKg) / 7;
  // In the direction of the goal, how much of the intended pace was made.
  const progress = slopePerDay * Math.sign(rate);
  const intended = Math.abs(intendedPerDay);
  const stalled = progress < intended * StallRule.paceFraction && intended - progress > slopeSigma;

  const summary = summarizeAdherence({
    through,
    intake,
    weights,
    history,
    floorKcal: snapshot.calorieFloorKcal,
    days: window,
    plannedShare,
  });

  if (!stalled) {
    return new StallAssessment({
      status: 'noStall',
      windowDays: window,
      gaining,
      usableFoodDays: summary.completeDays,
      weighIns: summary.weighIns,
      slopeKgPerWeek: slopePerDay * 7,
      intendedKgPerWeek: intendedPerDay * 7,
    });
  }

  // The one answer every feature gets (MM-155).
  const waistOverWindow = waistChangeOf({ waist, asOf: through, days: window });
  const waistChange = waistOverWindow?.changeCm;
  const maskedByEvent = effectiveWeightEvents(weightEvents).some(
    (e) => !e.date.isAfter(today) && e.date.daysUntil(today) <= StallRule.maskingEventDays,
  );
  const trainingStart = trainingStartOn(workouts, { asOf: today, gapDays: StallRule.trainingRestartGapDays });
  const maskedByTraining = trainingStart !== undefined && trainingStart.daysUntil(today) <= StallRule.maskingEventDays;

  let diagnosis: StallDiagnosis;
  if (summary.completeDays < StallRule.minimumFoodDays || summary.weighIns < StallRule.minimumWeighIns) {
    diagnosis = 'data';
  } else if (maskedByEvent || maskedByTraining || (!gaining && waistOverWindow?.direction === 'down')) {
    diagnosis = 'masked';
  } else if (summary.standing === (gaining ? 'below' : 'above')) {
    diagnosis = 'intake';
  } else {
    diagnosis = 'estimate';
  }

  const atFloor =
    !gaining &&
    (current.targets.flags.has('flooredAtSafetyMinimum') || current.targets.kcal <= snapshot.calorieFloorKcal + 1);
  let expectedChange: number | undefined;
  if (diagnosis === 'estimate' && !atFloor) {
    const step = SafetyBounds.maxWeeklyTargetChange(current.targets.kcal);
    const shift = clamp(snapshot.tdee.kcal - current.tdeeKcal, -step, step);
    const towardGoal = gaining ? shift > 0 : shift < 0;
    if (towardGoal) {
      expectedChange = gaining ? shift : Math.max(shift, snapshot.calorieFloorKcal - current.targets.kcal);
    }
  }

  return new StallAssessment({
    status: 'stalled',
    windowDays: window,
    diagnosis,
    gaining,
    usableFoodDays: summary.completeDays,
    weighIns: summary.weighIns,
    slopeKgPerWeek: slopePerDay * 7,
    intendedKgPerWeek: intendedPerDay * 7,
    averageIntakeKcal: summary.averageIntakeKcal,
    averageTargetKcal: summary.averageTargetKcal,
    waistChangeCm: waistChange,
    maskedByEvent,
    maskedByTraining,
    expectedChangeKcal: expectedChange,
    atFloor,
    estimateLow:
      diagnosis === 'estimate' && !gaining && snapshot.tdee.kcal < StallRule.lowEstimateRestingMultiple * snapshot.bmrKcal,
    shortSleepAverageMinutes: shortSleep(sleepAverage) ? sleepAverage?.averageMinutes : undefined,
    shortSleepNights: shortSleep(sleepAverage) ? sleepAverage?.nights : undefined,
  });
}
