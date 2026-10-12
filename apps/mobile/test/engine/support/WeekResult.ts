import type { DailyTargets, TargetsExplanation, TdeeEstimate } from '../../../src/engine';

/** Weekly snapshot from a closed-loop run. */
export interface WeekResult {
  readonly week: number;
  readonly targets: DailyTargets;
  readonly tdee: TdeeEstimate;
  readonly trueTdeeKcal: number;
  readonly trueWeightKg: number;
  readonly underReportFraction: number;

  /**
   * Why the targets issued this week were issued; undefined on weeks they
   * did not change.
   */
  readonly explanation: TargetsExplanation | undefined;
}
