import { cautiousBodyFatPercent } from './cautiousBodyFatPercent';
import { computeTargetsTraced } from './computeTargetsTraced';
import { energyDensityKcalPerKg } from './energyDensityKcalPerKg';
import { FatLossPace } from './FatLossPace';
import { leanFractionOfChange } from './leanFractionOfChange';
import type { PaceLimit } from './PaceLimit';
import type { PaceOption } from './PaceOption';
import { PaceRule } from './PaceRule';
import type { PaceWithheldReason } from './PaceWithheldReason';
import { SafetyBounds } from './SafetyBounds';
import { TargetInputs } from './TargetInputs';
import { TrainingStatus } from '../domain/TrainingStatus';

/**
 * The three fat-loss paces as they would apply to this person today
 * (MM-128), each run through the same calculation as real targets, with no
 * step limit, since a change of pace acts at once.
 *
 * Gentle is always offered. Standard needs the body-fat limit (MM-28) to
 * allow 0.75% a week. Faster needs it to allow 1% and estimated body fat
 * clearly high: the cautious figure (MM-132) at or above 25% for men, 35%
 * for women. A caution from the health check or age (a policy limit on the
 * pace) leaves only Gentle. Nothing here changes a target.
 */
export function describePaces(i: TargetInputs): PaceOption[] {
  const safetyBf = i.safetyBodyFatPercent ?? cautiousBodyFatPercent(i.bodyFat);
  const maxByBodyFat = SafetyBounds.maxWeeklyLossFraction(i.sex, safetyBf);
  const cautionMax = i.policy.maxWeeklyLossFraction;
  const clearlyHigh = cautiousBodyFatPercent(i.bodyFat) >= PaceRule.fasterBodyFatPercent[i.sex];
  const fatMassKg = i.bodyFat.fatMassKg(i.trendWeightKg);
  const rho = energyDensityKcalPerKg(
    leanFractionOfChange({ fatMassKg, losing: true, resistanceTrained: TrainingStatus.isResistanceTrained(i.trainingStatus) }),
  );

  return FatLossPace.values.map((pace) => {
    const fraction = FatLossPace.fraction(pace);
    let withheld: PaceWithheldReason | undefined;
    if (pace !== 'gentle' && cautionMax !== undefined && fraction > cautionMax + 1e-9) withheld = 'caution';
    else if (fraction > maxByBodyFat + 1e-9) withheld = 'bodyFat';
    else if (pace === 'faster' && !clearlyHigh) withheld = 'notLeanEnoughForFaster';

    const { targets } = computeTargetsTraced(
      new TargetInputs({
        sex: i.sex,
        heightCm: i.heightCm,
        trendWeightKg: i.trendWeightKg,
        bodyFat: i.bodyFat,
        mode: 'fatLoss',
        trainingStatus: i.trainingStatus,
        trainingDaysPerWeek: i.trainingDaysPerWeek,
        trainingKcalPerDay: i.trainingKcalPerDay,
        policy: i.policy,
        tdeeKcal: i.tdeeKcal,
        bmrKcal: i.bmrKcal,
        requestedLossFraction: fraction,
        safetyBodyFatPercent: i.safetyBodyFatPercent,
      }),
    );
    const deficitKcal = i.tdeeKcal + i.policy.maintenanceOffsetKcal - targets.kcal;
    const achievedFraction = (deficitKcal * 7) / (rho * i.trendWeightKg);
    let limitedBy: PaceLimit | undefined;
    if (targets.flags.has('flooredAtSafetyMinimum')) limitedBy = 'calorieFloor';
    else if (targets.flags.has('deficitCapped')) limitedBy = 'deficitCap';
    else if (fraction > maxByBodyFat + 1e-9 || (cautionMax !== undefined && fraction > cautionMax + 1e-9)) {
      limitedBy = 'bodyFatLimit';
    }
    return {
      pace,
      fraction,
      offered: withheld === undefined,
      withheld,
      deficitKcal,
      targetKcal: targets.kcal,
      achievedFraction,
      limitedBy,
      aboveFatSupply: deficitKcal > PaceRule.fatSupplyKcalPerKgFatMassDay * fatMassKg,
    };
  });
}
