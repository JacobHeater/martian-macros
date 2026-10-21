import type { CalendarDate } from '../domain/CalendarDate';
import type { GoalBodyFat } from '../domain/GoalBodyFat';
import type { GoalMode } from '../domain/GoalMode';
import { TrainingStatus } from '../domain/TrainingStatus';
import type { UserSetup } from '../domain/UserSetup';
import { clamp } from '../lang/clamp';
import { cautiousBodyFatPercent } from './cautiousBodyFatPercent';
import type { CoachSnapshot } from './CoachSnapshot';
import { consecutiveDeficitWeeks } from './consecutiveDeficitWeeks';
import { deficitStartOn } from './deficitStartOn';
import type { GoalBodyFatCheck } from './GoalBodyFatCheck';
import { leanFractionOfChange } from './leanFractionOfChange';
import { LeanGainRule } from './LeanGainRule';
import { MaintenanceRule } from './MaintenanceRule';
import type { PhaseEndReason } from './PhaseEndReason';
import type { PhasePlan } from './PhasePlan';
import type { PhaseRecommendation } from './PhaseRecommendation';
import { PhaseRule } from './PhaseRule';
import { quartileSigmas } from './safetyBodyFatConstants';
import { SafetyBounds } from './SafetyBounds';
import type { StallAssessment } from './StallAssessment';
import { suggestedMaintenanceWeeks } from './suggestedMaintenanceWeeks';
import type { TargetsRecord } from './TargetsRecord';

/** The earlier of two projected ends, with its reason. */
function earlier(
  a: readonly [CalendarDate, PhaseEndReason] | undefined,
  b: readonly [CalendarDate, PhaseEndReason] | undefined,
): readonly [CalendarDate, PhaseEndReason] | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return b[0].isBefore(a[0]) ? b : a;
}

/** Kilograms to change before `fatPercent` of `weightKg` becomes `linePercent`; undefined when it never does. */
function kgToLine({
  weightKg,
  fatPercent,
  linePercent,
  losing,
  resistanceTrained,
}: {
  weightKg: number;
  fatPercent: number;
  linePercent: number;
  losing: boolean;
  resistanceTrained: boolean;
}): number | undefined {
  const fatKg = (weightKg * fatPercent) / 100;
  // The fat share of each kilogram changed, as the partition reads it.
  const fatShare = 1 - leanFractionOfChange({ fatMassKg: fatKg, losing, resistanceTrained });
  const denominator = fatShare - linePercent / 100;
  if (denominator <= 0) return undefined;
  const kg = (losing ? fatKg - (linePercent * weightKg) / 100 : (linePercent * weightKg) / 100 - fatKg) / denominator;
  return Math.max(0, kg);
}

/**
 * The current phase and what follows it (MM-36), derived on demand.
 *
 * The phase is the trailing run of targets in the user's goal mode. Body
 * fat is always read as a range (MM-34): a cut ends once the lower end of
 * the range, the estimate less `quartileSigmas` deviations, reaches its
 * goal, so the app stops a cut as soon as the goal is plausibly reached,
 * as the safety rules read a threshold (MM-132); a gain ends once the
 * upper end reaches its line. A cut also ends at `PhaseRule.longestCutWeeks`
 * of unbroken deficit or when it has stalled at the calorie floor; a gain at
 * `LeanGainRule.stopWeeks` (MM-129); maintenance after either once it has run
 * the weeks MM-130 suggests. Then the next phase is recommended from the
 * range: maintenance, and after it a lean gain if the lower end is at the
 * cut's goal, another cut if not. Recomp is reviewed by MM-133, and
 * maintenance chosen for itself is open-ended; both show only how long
 * they have run.
 *
 * A goal the user set replaces the cut's default line unless it is under
 * the hard floor; under the soft floor its hold is limited to
 * `PhaseRule.lowGoalHoldWeeks`. With an eating-disorder history nothing
 * is projected or recommended from body fat: the phase and its length only.
 * A mode the policy does not offer is never recommended.
 */
export function planPhases({
  setup,
  snapshot,
  history,
  stall,
  goal,
  today,
}: {
  setup: UserSetup;
  snapshot: Pick<CoachSnapshot, 'policy' | 'trend' | 'trendWeightKg' | 'bodyFat' | 'deficitRestartOn'>;
  history: readonly TargetsRecord[];
  stall?: StallAssessment | undefined;
  goal?: GoalBodyFat | undefined;
  today: CalendarDate;
}): PhasePlan | undefined {
  const records = history
    .filter((record) => !record.effectiveFrom.isAfter(today))
    .sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  const latest = records[records.length - 1];
  if (latest === undefined) return undefined;

  const mode = setup.goalMode;
  // A goal changed today has its targets reissued at once; until they are, the phase starts today.
  let startedOn = today;
  if (latest.mode === mode) {
    for (let i = records.length - 1; i >= 0; i--) {
      const record = records[i] as TargetsRecord;
      if (record.mode !== mode) break;
      startedOn = record.effectiveFrom;
    }
  }
  const weeks = Math.trunc(startedOn.daysUntil(today) / 7);
  const plan = (rest: Partial<Pick<PhasePlan, 'linePercent' | 'recommendation'>> & {
    end?: readonly [CalendarDate, PhaseEndReason] | undefined;
  } = {}): PhasePlan => ({
    mode,
    startedOn,
    weeks,
    linePercent: rest.linePercent,
    projectedEndOn: rest.end?.[0],
    projectedEndReason: rest.end?.[1],
    recommendation: rest.recommendation,
  });
  if (setup.screening.eatingDisorderHistory) return plan();

  const sex = setup.profile.sex;
  const estimate = snapshot.bodyFat;
  const lowerPercent = cautiousBodyFatPercent(estimate);
  const upperPercent = clamp(estimate.percent + quartileSigmas * estimate.sigmaPercent, 2, 70);
  const check: GoalBodyFatCheck | undefined = goal === undefined ? undefined : SafetyBounds.checkGoalBodyFat(sex, goal.percent);
  const cutGoal = goal !== undefined && check !== 'rejected' ? goal.percent : PhaseRule.cutGoalPercent(sex);
  const atCutGoal = lowerPercent <= cutGoal;
  const resistanceTrained = TrainingStatus.isResistanceTrained(setup.trainingStatus);
  const weightKg = snapshot.trendWeightKg;

  // The pace now, in kg a week, when it is steady in the phase's direction.
  const point = snapshot.trend[snapshot.trend.length - 1];
  const steadyKgPerWeek = (direction: 1 | -1): number | undefined => {
    if (point === undefined) return undefined;
    const kgPerWeek = point.slopeKgPerDay * 7 * direction;
    return kgPerWeek > PhaseRule.steadyPaceSigmas * Math.sqrt(point.slopeVariance) * 7 ? kgPerWeek : undefined;
  };
  const projectTo = (kg: number | undefined, kgPerWeek: number | undefined): CalendarDate | undefined =>
    kg === undefined || kgPerWeek === undefined ? undefined : today.addDays(Math.ceil((kg / kgPerWeek) * 7));

  const offered = (m: GoalMode) => snapshot.policy.allowedModes.has(m);
  const recommend = (
    reason: PhaseEndReason,
    next: GoalMode,
    { nextWeeks, then }: { nextWeeks?: number; then?: GoalMode } = {},
  ): PhaseRecommendation | undefined =>
    !offered(next) || next === mode
      ? undefined
      : { reason, next, nextWeeks, then: then !== undefined && then !== next && offered(then) ? then : undefined };
  const holdAfterCut = (deficitWeeks: number) => {
    const weeksAfter = suggestedMaintenanceWeeks(deficitWeeks);
    return check === 'warnAndTimeLimit' && atCutGoal ? Math.min(weeksAfter, PhaseRule.lowGoalHoldWeeks) : weeksAfter;
  };
  const afterHold: GoalMode = atCutGoal ? 'leanGain' : 'fatLoss';

  switch (mode) {
    case 'fatLoss': {
      const restartOn = snapshot.deficitRestartOn;
      const deficitWeeks = consecutiveDeficitWeeks(records, today, { restartOn });
      const deficitFrom = deficitStartOn(records, today, { restartOn });
      let reason: PhaseEndReason | undefined;
      if (atCutGoal) reason = 'goalReached';
      else if (deficitWeeks >= PhaseRule.longestCutWeeks) reason = 'longestCut';
      else if (stall?.status === 'stalled' && stall.diagnosis === 'estimate' && stall.atFloor) reason = 'stalledAtFloor';
      if (reason !== undefined) {
        return plan({
          linePercent: cutGoal,
          recommendation: recommend(reason, 'maintenance', { nextWeeks: holdAfterCut(deficitWeeks), then: afterHold }),
        });
      }
      const cap = deficitFrom === undefined ? undefined : ([deficitFrom.addDays(PhaseRule.longestCutWeeks * 7), 'longestCut'] as const);
      const kg = kgToLine({ weightKg, fatPercent: lowerPercent, linePercent: cutGoal, losing: true, resistanceTrained });
      const reachedOn = projectTo(kg, steadyKgPerWeek(-1));
      return plan({ linePercent: cutGoal, end: earlier(cap, reachedOn === undefined ? undefined : [reachedOn, 'goalReached']) });
    }
    case 'leanGain': {
      const line = LeanGainRule.stopBodyFatPercent[sex];
      let reason: PhaseEndReason | undefined;
      if (upperPercent >= line) reason = 'gainLine';
      else if (weeks >= LeanGainRule.stopWeeks) reason = 'longestGain';
      if (reason !== undefined) {
        return plan({
          linePercent: line,
          recommendation: recommend(reason, 'maintenance', { nextWeeks: MaintenanceRule.minimumMaintenanceWeeks, then: 'fatLoss' }),
        });
      }
      const cap = [startedOn.addDays(LeanGainRule.stopWeeks * 7), 'longestGain'] as const;
      const kg = kgToLine({ weightKg, fatPercent: upperPercent, linePercent: line, losing: false, resistanceTrained });
      const reachedOn = projectTo(kg, steadyKgPerWeek(1));
      return plan({ linePercent: line, end: earlier(cap, reachedOn === undefined ? undefined : [reachedOn, 'gainLine']) });
    }
    case 'maintenance': {
      // A hold after a cut or a gain has an end; maintenance chosen for itself does not.
      const before = records.filter((record) => record.effectiveFrom.isBefore(startedOn));
      const from = before[before.length - 1];
      if (from === undefined || from.mode === 'maintenance') return plan();
      const holdWeeks =
        from.mode === 'leanGain' ? MaintenanceRule.minimumMaintenanceWeeks : holdAfterCut(consecutiveDeficitWeeks(before, startedOn));
      const endsOn = startedOn.addDays(holdWeeks * 7);
      return plan({
        linePercent: cutGoal,
        end: [endsOn, 'holdDone'],
        recommendation: weeks >= holdWeeks ? recommend('holdDone', afterHold) : undefined,
      });
    }
    case 'recomp':
      return plan();
  }
}
