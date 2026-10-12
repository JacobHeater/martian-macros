import { computeTargetsTraced } from './computeTargetsTraced';
import type { DailyTargets } from './DailyTargets';
import type { TargetInputs } from './TargetInputs';

/** Computes the week's daily targets. Pure function of `i`. */
export function computeTargets(i: TargetInputs): DailyTargets {
  return computeTargetsTraced(i).targets;
}
