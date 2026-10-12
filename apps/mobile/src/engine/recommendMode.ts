import type { BiologicalSex } from '../domain/BiologicalSex';
import type { CoachingPolicy } from '../domain/CoachingPolicy';
import type { TrainingStatus } from '../domain/TrainingStatus';
import type { ModeRecommendation } from './ModeRecommendation';

/**
 * Recommends a starting mode. The user may pick any mode the policy
 * allows; this only decides the default and the onboarding copy.
 *
 * The body-fat cut-offs are product heuristics informed by Barakat et al.
 * (2020), not thresholds from the literature.
 */
export function recommendMode({
  sex,
  bodyFatPercent,
  trainingStatus,
  policy,
}: {
  sex: BiologicalSex;
  bodyFatPercent: number;
  trainingStatus: TrainingStatus;
  policy: CoachingPolicy;
}): ModeRecommendation {
  if (policy.underweight) {
    return { mode: 'maintenance', reason: 'underweight' };
  }
  if (!policy.allowedModes.has('fatLoss')) {
    return { mode: 'maintenance', reason: 'deficitNotAllowed' };
  }
  const [lean, recompHigh, veryHigh] = sex === 'male' ? [15, 20, 25] : [23, 30, 35];
  const bf = bodyFatPercent;
  if (bf >= veryHigh) {
    return { mode: 'fatLoss', reason: 'highBodyFat' };
  }
  const earlyTraining =
    trainingStatus === 'untrained' || trainingStatus === 'novice' || trainingStatus === 'returning';
  if (earlyTraining || bf >= recompHigh) {
    return { mode: 'recomp', reason: 'recompEligible' };
  }
  if (bf <= lean) {
    return { mode: 'leanGain', reason: 'leanAndTrained' };
  }
  return { mode: 'fatLoss', reason: 'cutFirst' };
}
