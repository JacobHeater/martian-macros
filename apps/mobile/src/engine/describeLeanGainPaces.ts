import { LeanGainPace } from '../domain/LeanGainPace';
import { computeTargetsTraced } from './computeTargetsTraced';
import type { LeanGainPaceOption } from './LeanGainPaceOption';
import { TargetInputs } from './TargetInputs';

/**
 * The two lean-gain paces as they would apply to this person today
 * (MM-480), each run through the same calculation as real targets, the
 * surplus cap (MM-129) included, with no step limit. Nothing here changes
 * a target.
 */
export function describeLeanGainPaces(i: TargetInputs): LeanGainPaceOption[] {
  return LeanGainPace.values.map((pace) => {
    const { targets } = computeTargetsTraced(
      new TargetInputs({
        sex: i.sex,
        heightCm: i.heightCm,
        trendWeightKg: i.trendWeightKg,
        bodyFat: i.bodyFat,
        mode: 'leanGain',
        trainingStatus: i.trainingStatus,
        trainingDaysPerWeek: i.trainingDaysPerWeek,
        trainingKcalPerDay: i.trainingKcalPerDay,
        policy: i.policy,
        tdeeKcal: i.tdeeKcal,
        bmrKcal: i.bmrKcal,
        leanGainPace: pace,
        safetyBodyFatPercent: i.safetyBodyFatPercent,
      }),
    );
    return {
      pace,
      fraction: targets.weeklyRateFraction,
      surplusKcal: targets.kcal - i.tdeeKcal - i.policy.maintenanceOffsetKcal,
      targetKcal: targets.kcal,
      capped: targets.flags.has('surplusCapped'),
    };
  });
}
