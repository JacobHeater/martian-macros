import type { GoalMode } from '../domain/GoalMode';
import { TrainingStatus } from '../domain/TrainingStatus';
import { clamp } from '../lang/clamp';
import { DailyTargets } from './DailyTargets';
import { DietBreakRule } from './DietBreakRule';
import { energyDensityKcalPerKg } from './energyDensityKcalPerKg';
import { leanFractionOfChange } from './leanFractionOfChange';
import { cautiousBodyFatPercent } from './cautiousBodyFatPercent';
import { PaceRule } from './PaceRule';
import { SafetyBounds } from './SafetyBounds';
import type { TargetFlag } from './TargetFlag';
import type { TargetInputs } from './TargetInputs';
import type { TargetsTrace } from './TargetsTrace';

/**
 * `computeTargets`, with the calorie target at each stage, so a change can
 * be explained (MM-138).
 */
export function computeTargetsTraced(i: TargetInputs): { targets: DailyTargets; trace: TargetsTrace } {
  const flags = new Set<TargetFlag>();
  const safetyBf = i.safetyBodyFatPercent ?? cautiousBodyFatPercent(i.bodyFat);

  let mode = i.mode;
  if (!i.policy.allowedModes.has(mode)) {
    mode = 'maintenance';
    flags.add(i.policy.underweight ? 'underweightMaintenance' : 'modeNotAllowed');
  }

  let rate = weeklyRate(mode, i, safetyBf);
  if (mode === 'maintenance' && rate !== 0) flags.add('maintenanceCorrection');
  // A surplus without training is stored as fat (MM-134): maintenance until a workout is logged.
  if (rate > 0 && i.trainingLapsed) {
    rate = 0;
    flags.add('trainingLapsed');
  }
  // A diet break (MM-135): the one the user chose, the one already running,
  // or the one the app plans at the cap. Each is maintenance for its length.
  if (rate < 0 && i.breakRequested) {
    rate = 0;
    flags.add('requestedBreak');
  } else if (rate < 0 && i.continuingBreak !== undefined) {
    rate = 0;
    flags.add(i.continuingBreak);
  } else if (rate < 0 && i.consecutiveDeficitWeeks >= DietBreakRule.forceFromWeeks) {
    rate = 0;
    flags.add('dietBreak');
  }

  const rho = energyDensityKcalPerKg(
    leanFractionOfChange({
      fatMassKg: i.bodyFat.fatMassKg(i.trendWeightKg),
      losing: rate < 0,
      resistanceTrained: TrainingStatus.isResistanceTrained(i.trainingStatus),
    }),
  );
  let dailyEnergyDelta = (rho * rate * i.trendWeightKg) / 7;
  // A deficit never exceeds a share of expenditure (MM-128): a share of body
  // weight asks the same calories per kilogram of everyone, and a heavy,
  // sedentary body spends fewer. The pace recorded is the one this gives.
  const maxDeficit = PaceRule.maxDeficitFractionOfExpenditure * i.tdeeKcal;
  if (-dailyEnergyDelta > maxDeficit) {
    dailyEnergyDelta = -maxDeficit;
    rate = (dailyEnergyDelta * 7) / (rho * i.trendWeightKg);
    flags.add('deficitCapped');
  }
  let kcal = i.tdeeKcal + dailyEnergyDelta + i.policy.maintenanceOffsetKcal;
  // The two-step way out of a deficit (MM-130): this set stops halfway.
  if (mode === 'maintenance' && i.easeFromKcal !== undefined && i.easeFromKcal < kcal) {
    kcal = (i.easeFromKcal + kcal) / 2;
    flags.add('easingIn');
  }
  const formulaKcal = kcal;
  let limitedKcal = kcal;
  let heldKcal = kcal;
  let raisedKcal = kcal;

  const previous = i.previous;
  if (previous !== undefined) {
    // A raise the safety rules ask for is not step-limited: a diet break, a
    // too-fast loss, and a deficit the health check or body weight no longer
    // allows all exist to put calories back now. Reductions and
    // ordinary changes keep the limit.
    const exemptRaise =
      (flags.has('dietBreak') ||
        flags.has('requestedBreak') ||
        flags.has('underweightMaintenance') ||
        flags.has('modeNotAllowed')) &&
      kcal > previous.kcal;
    if (!exemptRaise) {
      const maxStep = SafetyBounds.maxWeeklyTargetChange(previous.kcal);
      const limited = clamp(kcal, previous.kcal - maxStep, previous.kcal + maxStep);
      if (limited !== kcal) flags.add('rateLimited');
      kcal = limited;
    }
    limitedKcal = kcal;
    if (previous.flags.has('raisedForSafePace') && i.safetyRaiseKcal === 0 && kcal < previous.kcal) {
      kcal = previous.kcal;
      flags.delete('rateLimited');
      flags.add('heldAfterSafetyRaise');
    }
    heldKcal = kcal;
    if (i.safetyRaiseKcal > 0 && previous.kcal + i.safetyRaiseKcal > kcal) {
      kcal = previous.kcal + i.safetyRaiseKcal;
      flags.delete('rateLimited');
      flags.add('raisedForSafePace');
    }
    raisedKcal = kcal;
  }

  const floor = SafetyBounds.calorieFloorKcal({
    sex: i.sex,
    bmrKcal: i.bmrKcal,
    bodyFatPercent: safetyBf,
    fatFreeMassUpperKg: i.bodyFat.fatFreeMassUpperKg(i.trendWeightKg),
    trainingKcalPerDay: i.trainingKcalPerDay,
  });
  if (kcal < floor) {
    kcal = floor;
    flags.add('flooredAtSafetyMinimum');
  }

  const protein = SafetyBounds.proteinTargetsG({
    sex: i.sex,
    weightKg: i.trendWeightKg,
    heightCm: i.heightCm,
    bodyFatPercent: safetyBf,
    inDeficit: rate < 0,
    lifting: !(i.trainingStatus === 'untrained' && i.trainingDaysPerWeek === 0),
    policy: i.policy,
  });
  if (i.policy.proteinCapGPerKg !== undefined) flags.add('proteinCapped');
  const proteinG = protein.targetG;

  const minFat = SafetyBounds.minFatG({ sex: i.sex, weightKg: i.trendWeightKg, heightCm: i.heightCm, kcal });
  let fatG = Math.max(minFat, (0.25 * kcal) / 9);
  let carbsG = (kcal - 4 * proteinG - 9 * fatG) / 4;
  if (carbsG < 0) {
    fatG = minFat;
    carbsG = Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4);
  }

  return {
    targets: new DailyTargets({
      kcal,
      proteinG,
      proteinMinimumG: protein.minimumG,
      fatG,
      carbsG,
      weeklyRateFraction: rate,
      flags,
    }),
    trace: { formulaKcal, limitedKcal, heldKcal, raisedKcal, finalKcal: kcal },
  };
}

function weeklyRate(mode: GoalMode, i: TargetInputs, safetyBf: number): number {
  const bf = i.bodyFat.percent;
  const highBodyFat = i.sex === 'male' ? bf >= 20 : bf >= 30;
  switch (mode) {
    case 'fatLoss':
      return -Math.min(
        Math.min(i.requestedLossFraction ?? 0.0075, SafetyBounds.maxWeeklyLossFraction(i.sex, safetyBf)),
        i.policy.maxWeeklyLossFraction ?? Number.POSITIVE_INFINITY,
      );
    case 'recomp':
      return highBodyFat ? -0.0025 : -0.001;
    case 'leanGain':
      switch (i.trainingStatus) {
        case 'untrained':
        case 'novice':
        case 'returning':
          return 0.0035;
        default:
          return i.policy.elevatedMuscleGainPrior ? 0.0025 : 0.0015;
      }
    case 'maintenance':
      // A correction back toward the maintenance anchor (MM-130), else held.
      return i.correctionRateFraction ?? 0;
  }
}
