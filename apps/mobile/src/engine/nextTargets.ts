import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import { TrainingStatus } from '../domain/TrainingStatus';
import type { UserSetup } from '../domain/UserSetup';
import { calibrationDays, checkInIntervalDays } from './coachConstants';
import type { CoachSnapshot } from './CoachSnapshot';
import { computeTargetsTraced } from './computeTargetsTraced';
import { consecutiveDeficitWeeks } from './consecutiveDeficitWeeks';
import { currentTargetRulesVersion } from './currentTargetRulesVersion';
import type { DailyTargets } from './DailyTargets';
import { explainTargets } from './explainTargets';
import type { ExplanationTrigger } from './ExplanationTrigger';
import { latestEndedPause } from './latestEndedPause';
import { lossSafetyRaiseKcal } from './lossSafetyRaiseKcal';
import { pauseOn } from './pauseOn';
import { cautiousBodyFatPercent } from './cautiousBodyFatPercent';
import { safetyBodyFatDeadbandPercent } from './safetyBodyFatConstants';
import { safetyBodyFatPercent } from './safetyBodyFatPercent';
import { TargetInputs } from './TargetInputs';
import { TargetsRecord } from './TargetsRecord';

/**
 * Decides whether targets change today. Returns the new record, or
 * undefined to keep the current ones.
 *
 * - First run: initial targets from the formula prior.
 * - Mode change: immediate, with no step limit (a cut-to-maintenance
 *   switch must not be throttled).
 * - Otherwise at most every `checkInIntervalDays`. Adaptive changes wait
 *   out the calibration period and a holding estimator; a raise for a
 *   too-fast loss (MM-115) does not.
 * - A maintenance week the user asked for: immediate (MM-117).
 * - Never during a pause, and not at a weekly check-in until
 *   `checkInIntervalDays` after one ends (MM-148).
 */
export function nextTargets({
  setup,
  snapshot,
  history,
  today,
  pauses = [],
}: {
  setup: UserSetup;
  snapshot: CoachSnapshot;
  history: readonly TargetsRecord[];
  today: CalendarDate;
  pauses?: readonly Pause[];
}): TargetsRecord | undefined {
  if (snapshot.policy.blocked || !snapshot.policy.targetsAllowed) return undefined;

  const last = history[history.length - 1];
  const lastSafetyBf = last?.safetyBodyFatPercent;
  const safetyBf = safetyBodyFatPercent(snapshot.bodyFat, { previous: lastSafetyBf });

  const build = ({
    previous,
    deficitWeeks = 0,
    safetyRaiseKcal = 0,
    breakRequested = false,
    trigger = 'checkIn',
  }: {
    previous?: DailyTargets;
    deficitWeeks?: number;
    safetyRaiseKcal?: number;
    breakRequested?: boolean;
    trigger?: ExplanationTrigger;
  } = {}): TargetsRecord => {
    const traced = computeTargetsTraced(
      new TargetInputs({
        sex: setup.profile.sex,
        heightCm: setup.profile.heightCm,
        trendWeightKg: snapshot.trendWeightKg,
        bodyFat: snapshot.bodyFat,
        mode: setup.goalMode,
        trainingStatus: setup.trainingStatus,
        trainingDaysPerWeek: setup.trainingDaysPerWeek,
        policy: snapshot.policy,
        tdeeKcal: snapshot.tdee.kcal,
        bmrKcal: snapshot.bmrKcal,
        previous,
        consecutiveDeficitWeeks: deficitWeeks,
        requestedLossFraction: setup.requestedLossFraction,
        safetyBodyFatPercent: safetyBf,
        safetyRaiseKcal,
        breakRequested,
      }),
    );
    const targets = traced.targets;
    const forcedToMaintenance = targets.flags.has('underweightMaintenance') || targets.flags.has('modeNotAllowed');
    return new TargetsRecord({
      effectiveFrom: today,
      profileRevision: setup.profileRevision,
      // A goal the policy no longer allows (low body weight, MM-111; a health
      // check answer, MM-83) is stored as the maintenance it became; the app
      // also moves the user's goal there, so it does not resume by itself
      // when the reason goes away.
      mode: forcedToMaintenance ? 'maintenance' : setup.goalMode,
      tdeeKcal: snapshot.tdee.kcal,
      tdeeSigmaKcal: snapshot.tdee.sigmaKcal,
      tdeeStatus: snapshot.tdee.status,
      safetyBodyFatPercent: safetyBf,
      targets,
      summarySeen: false,
      explanation: explainTargets({
        trigger: targets.flags.has('underweightMaintenance')
          ? 'underweightRule'
          : targets.flags.has('modeNotAllowed')
            ? 'healthRule'
            : last === undefined
              ? 'firstTargets'
              : trigger,
        previous: last,
        targets,
        trace: traced.trace,
        tdee: snapshot.tdee,
        confidence: snapshot.confidence,
      }),
    });
  };

  if (last === undefined) return build();
  if (pauseOn(pauses, today) !== undefined) return undefined;

  const deficitWeeks = () => consecutiveDeficitWeeks(history, today, { restartOn: snapshot.deficitRestartOn });

  // A goal change applies at once. Not when the last record already holds the
  // user at maintenance because their weight or health check rules out the
  // goal they still have stored (the app then moves the goal itself,
  // MM-111, MM-83).
  const heldAtMaintenance =
    (last.targets.flags.has('underweightMaintenance') || last.targets.flags.has('modeNotAllowed')) &&
    !snapshot.policy.allowedModes.has(setup.goalMode);
  if (last.mode !== setup.goalMode && !heldAtMaintenance) {
    return build({ trigger: 'goalChange' });
  }

  // A corrected sex, date of birth, height or health check: the old targets
  // were made for someone else, so new ones start now, without the weekly
  // step limit (MM-83).
  if (setup.profileRevision !== last.profileRevision) {
    return build({ deficitWeeks: deficitWeeks(), trigger: 'profileCorrection' });
  }

  // A body-fat estimate that has moved leaner, say because the user corrected
  // it in Settings, applies the stricter limits at once; one that moved
  // fatter waits for the check-in (MM-132).
  if (
    lastSafetyBf !== undefined &&
    cautiousBodyFatPercent(snapshot.bodyFat) < lastSafetyBf - safetyBodyFatDeadbandPercent
  ) {
    return build({ previous: last.targets, deficitWeeks: deficitWeeks(), trigger: 'bodyFatCorrection' });
  }

  if (last.targetRulesVersion < currentTargetRulesVersion) {
    return build({ previous: last.targets, deficitWeeks: deficitWeeks(), trigger: 'appRuleUpdate' });
  }

  // A maintenance week the user asked for starts at once (MM-117). It is a
  // set of targets like any other, so the next check-in is a week later,
  // and being at maintenance it ends the unbroken deficit.
  const breakFrom = setup.maintenanceWeekFrom;
  if (
    breakFrom !== undefined &&
    !today.isBefore(breakFrom) &&
    breakFrom.daysUntil(today) < checkInIntervalDays &&
    last.effectiveFrom.isBefore(breakFrom)
  ) {
    return build({ previous: last.targets, breakRequested: true });
  }

  if (last.effectiveFrom.daysUntil(today) < checkInIntervalDays) return undefined;
  const ended = latestEndedPause(pauses, today);
  if (ended !== undefined && ended.resumesOn.daysUntil(today) < checkInIntervalDays) {
    return undefined;
  }

  // Losing faster than the safe pace is not noise, so this runs through
  // calibration and while the estimate is held.
  const raise = lossSafetyRaiseKcal({
    trend: snapshot.trend,
    history,
    sex: setup.profile.sex,
    bodyFat: snapshot.bodyFat,
    safetyBodyFatPercent: safetyBf,
    resistanceTrained: TrainingStatus.isResistanceTrained(setup.trainingStatus),
  });
  // A deficit the policy no longer allows (body weight has fallen into the
  // underweight range, MM-111) ends at this check-in, calibration or not.
  const deficitNoLongerAllowed =
    last.targets.weeklyRateFraction < 0 && !snapshot.policy.allowedModes.has(setup.goalMode);
  if (raise > 0 || deficitNoLongerAllowed) {
    return build({ previous: last.targets, deficitWeeks: deficitWeeks(), safetyRaiseKcal: raise });
  }

  if (setup.onboardedOn.daysUntil(today) < calibrationDays) return undefined;
  if (snapshot.tdee.status === 'held' || snapshot.confidence.level === 'learning') {
    return undefined;
  }

  const next = build({ previous: last.targets, deficitWeeks: deficitWeeks() });
  if (snapshot.creatineReductionPausedOn(today) && next.targets.kcal < last.targets.kcal) {
    return undefined;
  }
  return next;
}
