import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import { TrainingStatus } from '../domain/TrainingStatus';
import type { UserSetup } from '../domain/UserSetup';
import { calibrationDays, checkInIntervalDays } from './coachConstants';
import { breakInForce, type BreakFlag } from './breakInForce';
import type { CoachSnapshot } from './CoachSnapshot';
import { computeTargetsTraced } from './computeTargetsTraced';
import { consecutiveDeficitWeeks } from './consecutiveDeficitWeeks';
import { currentTargetRulesVersion } from './currentTargetRulesVersion';
import { DietBreakRule } from './DietBreakRule';
import type { DailyTargets } from './DailyTargets';
import { explainTargets } from './explainTargets';
import { FatLossPace } from './FatLossPace';
import type { ExplanationTrigger } from './ExplanationTrigger';
import { latestEndedPause } from './latestEndedPause';
import { lossSafetyRaiseKcal } from './lossSafetyRaiseKcal';
import { assessMaintenanceDrift } from './assessMaintenanceDrift';
import { maintenanceAnchorOf } from './maintenanceAnchorOf';
import { MaintenanceRule } from './MaintenanceRule';
import { pauseOn } from './pauseOn';
import { cautiousBodyFatPercent } from './cautiousBodyFatPercent';
import { safetyBodyFatDeadbandPercent } from './safetyBodyFatConstants';
import { safetyBodyFatPercent } from './safetyBodyFatPercent';
import type { SleepAverage } from './SleepAverage';
import { TargetInputs } from './TargetInputs';
import { TargetsRecord } from './TargetsRecord';
import { TdeeEstimate } from './TdeeEstimate';

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
 * - A diet break the user asked for: immediate (MM-117, MM-135). A break,
 *   chosen or planned at the cap, holds for its length, and the deficit
 *   then resumes at once, unthrottled, like a change of goal.
 * - Never during a pause, and not at a weekly check-in until
 *   `checkInIntervalDays` after one ends (MM-148).
 * - A pace change: immediate, built on the estimate the current targets
 *   rest on (MM-128).
 * - At maintenance (MM-130): once the anchor is set, targets change only
 *   when the expenditure estimate moved beyond its own uncertainty, never
 *   for drift inside the band; drifted out for two weeks, nothing changes
 *   until the user answers; a correction they chose runs a gentle pace back
 *   toward the anchor. Leaving a deficit with the two-step option on stops
 *   halfway for a week.
 */
export function nextTargets({
  setup,
  snapshot,
  history,
  today,
  pauses = [],
  easeIntoMaintenance = false,
  trainingLapsed = false,
  sleepAverage,
}: {
  setup: UserSetup;
  snapshot: CoachSnapshot;
  history: readonly TargetsRecord[];
  today: CalendarDate;
  pauses?: readonly Pause[];
  /** The person's choice to leave a deficit in two steps (MM-130). */
  easeIntoMaintenance?: boolean;
  /** On lean gain, training has lapsed (`trainingSuspended`, MM-134): the surplus is replaced by maintenance. */
  trainingLapsed?: boolean;
  /** The fourteen-night average from the nights recorded (MM-250), noted in the explanation when short (MM-252). */
  sleepAverage?: SleepAverage | undefined;
}): TargetsRecord | undefined {
  if (snapshot.policy.blocked || !snapshot.policy.targetsAllowed) return undefined;

  const last = history[history.length - 1];
  const lastSafetyBf = last?.safetyBodyFatPercent;
  const safetyBf = safetyBodyFatPercent(snapshot.bodyFat, { previous: lastSafetyBf });
  // A diet break still running: targets reissued inside it stay on it (MM-135).
  const running = breakInForce(history, today);

  const build = ({
    previous,
    deficitWeeks = 0,
    safetyRaiseKcal = 0,
    breakRequested = false,
    continuingBreak = running?.flag,
    trigger = 'checkIn',
    restingOn,
    correctionRateFraction,
    easeFromKcal,
  }: {
    previous?: DailyTargets;
    deficitWeeks?: number;
    safetyRaiseKcal?: number;
    breakRequested?: boolean;
    continuingBreak?: BreakFlag | undefined;
    trigger?: ExplanationTrigger;
    /** The expenditure estimate to build on instead of today's, when only the pace changed (MM-128). */
    restingOn?: number;
    /** A gentle pace back toward the maintenance anchor (MM-130). */
    correctionRateFraction?: number;
    /** The target before leaving a deficit, for the first of two steps (MM-130). */
    easeFromKcal?: number | undefined;
  } = {}): TargetsRecord => {
    // The estimate these targets rest on: today's, or the one the current targets were built on.
    const tdee =
      restingOn === undefined
        ? snapshot.tdee
        : new TdeeEstimate({
            kcal: restingOn,
            sigmaKcal: snapshot.tdee.sigmaKcal,
            status: snapshot.tdee.status,
            usableIntakeDays: snapshot.tdee.usableIntakeDays,
            excludedPartialDays: snapshot.tdee.excludedPartialDays,
            weighIns: snapshot.tdee.weighIns,
            windowStart: snapshot.tdee.windowStart,
            clampedToBounds: snapshot.tdee.clampedToBounds,
            settlingUntil: snapshot.tdee.settlingUntil,
            styleRestartOn: snapshot.tdee.styleRestartOn,
          });
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
        tdeeKcal: tdee.kcal,
        bmrKcal: snapshot.bmrKcal,
        previous,
        consecutiveDeficitWeeks: deficitWeeks,
        requestedLossFraction: setup.requestedLossFraction,
        safetyBodyFatPercent: safetyBf,
        safetyRaiseKcal,
        breakRequested,
        continuingBreak,
        correctionRateFraction,
        easeFromKcal,
        trainingLapsed,
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
      tdeeKcal: tdee.kcal,
      tdeeSigmaKcal: tdee.sigmaKcal,
      tdeeStatus: tdee.status,
      safetyBodyFatPercent: safetyBf,
      requestedLossFraction: setup.requestedLossFraction,
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
        tdee,
        confidence: snapshot.confidence,
        sleepAverage,
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
    // Leaving a deficit goes straight to maintenance at the measured
    // expenditure, in one step (MM-130); or in two, a week apart, when the
    // person chose to ease into it.
    const leavingDeficit = setup.goalMode === 'maintenance' && last.targets.weeklyRateFraction < 0;
    return build({ trigger: 'goalChange', easeFromKcal: leavingDeficit && easeIntoMaintenance ? last.targets.kcal : undefined });
  }

  // No training days set on a gain: the surplus pauses at once, with the reason (MM-134).
  if (
    setup.goalMode === 'leanGain' &&
    trainingLapsed &&
    setup.trainingDaysPerWeek === 0 &&
    !last.targets.flags.has('trainingLapsed')
  ) {
    return build({ previous: last.targets, trigger: 'trainingLapse' });
  }

  // The second of the two steps out of a deficit, a week after the first (MM-130).
  if (last.targets.flags.has('easingIn') && last.effectiveFrom.daysUntil(today) >= MaintenanceRule.easeInStepDays) {
    return build({ trigger: 'goalChange' });
  }

  // A pace chosen since the current targets applies at once, like a change
  // of goal, with no step limit (MM-128). It is built on the expenditure
  // estimate the current targets rest on, so only the pace moves the target:
  // the estimate's own movement waits for the check-in, as it always does,
  // and a gentler pace never lowers the target (MM-117).
  const paceOf = (fraction: number | undefined) => fraction ?? FatLossPace.fraction(FatLossPace.default);
  if (
    setup.goalMode === 'fatLoss' &&
    last.mode === 'fatLoss' &&
    Math.abs(paceOf(last.requestedLossFraction) - paceOf(setup.requestedLossFraction)) > 1e-9
  ) {
    return build({ deficitWeeks: deficitWeeks(), trigger: 'paceChange', restingOn: last.tdeeKcal });
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

  // A diet break the user asked for starts at once (MM-117, MM-135): a set
  // of targets like any other, at maintenance for the break's length, which
  // ends the unbroken deficit.
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
  // A diet break holds for its length (MM-135)...
  if (running !== undefined) return undefined;
  const ended = latestEndedPause(pauses, today);
  if (ended !== undefined && ended.resumesOn.daysUntil(today) < checkInIntervalDays) {
    return undefined;
  }
  // ...and the deficit then resumes at once, as it would after a change of
  // goal, not 100 kcal a week: a planned return is neither a noisy week nor
  // a spiral. The count starts again from these targets.
  if (last.targets.flags.has('dietBreak') || last.targets.flags.has('requestedBreak')) {
    return build({ trigger: 'breakEnded' });
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
  // So does the break the app plans at the cap (MM-135): a safety floor
  // does not wait for the estimate to settle.
  const capReached = last.targets.weeklyRateFraction < 0 && deficitWeeks() >= DietBreakRule.forceFromWeeks;
  if (raise > 0 || deficitNoLongerAllowed || capReached) {
    return build({ previous: last.targets, deficitWeeks: deficitWeeks(), safetyRaiseKcal: raise });
  }

  if (setup.onboardedOn.daysUntil(today) < calibrationDays) return undefined;
  if (snapshot.tdee.status === 'held' || snapshot.confidence.level === 'learning') {
    return undefined;
  }

  // Maintaining (MM-130): judged against the anchor, once there is one.
  if (setup.goalMode === 'maintenance' && last.mode === 'maintenance') {
    const anchor = maintenanceAnchorOf({ history, trend: snapshot.trend, today, acceptedOn: setup.maintenanceAnchorOn });
    const drift = anchor === undefined ? undefined : assessMaintenanceDrift({ anchor, trend: snapshot.trend, today });
    if (anchor !== undefined && drift !== undefined) {
      const correctionFrom = setup.maintenanceCorrectionFrom;
      const correcting = correctionFrom !== undefined && !today.isBefore(correctionFrom);
      if (correcting && Math.abs(drift.deviationKg) > anchor.halfWidthKg * MaintenanceRule.correctionDoneFraction) {
        // Back toward the anchor at a gentle pace, in the needed direction.
        const rate = -Math.sign(drift.deviationKg) * MaintenanceRule.correctionFraction;
        return build({ previous: last.targets, correctionRateFraction: rate });
      }
      if (drift.status === 'out' && !correcting) {
        // Out for two weeks: the coach asks, and changes nothing until answered.
        return undefined;
      }
      // Inside the band (or back in it), targets move only when the
      // estimate moved beyond its own uncertainty, never for drift.
      if (!last.targets.flags.has('maintenanceCorrection') && Math.abs(snapshot.tdee.kcal - last.tdeeKcal) <= snapshot.tdee.sigmaKcal) {
        return undefined;
      }
    }
  }

  const next = build({ previous: last.targets, deficitWeeks: deficitWeeks() });
  if (snapshot.creatineReductionPausedOn(today) && next.targets.kcal < last.targets.kcal) {
    return undefined;
  }
  return next;
}
