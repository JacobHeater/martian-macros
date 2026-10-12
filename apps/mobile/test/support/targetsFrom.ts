import type { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { DailyTargets } from '../../src/engine/DailyTargets';
import type { TargetFlag } from '../../src/engine/TargetFlag';
import type { TargetsExplanation } from '../../src/engine/TargetsExplanation';
import { TargetsRecord } from '../../src/engine/TargetsRecord';
import type { TdeeStatus } from '../../src/engine/TdeeStatus';

/** Targets in force from `effectiveFrom`, with ordinary figures unless given. */
export function targetsFrom(
  effectiveFrom: CalendarDate,
  {
    kcal = 2400,
    proteinG = 170,
    proteinMinimumG,
    fatG = 70,
    carbsG = 250,
    weeklyRateFraction = -0.0075,
    flags,
    mode = 'fatLoss',
    tdeeKcal = 2700,
    tdeeSigmaKcal = 400,
    tdeeStatus = 'held',
    explanation,
    summarySeen,
  }: {
    kcal?: number;
    proteinG?: number;
    proteinMinimumG?: number;
    fatG?: number;
    carbsG?: number;
    weeklyRateFraction?: number;
    flags?: ReadonlySet<TargetFlag>;
    mode?: GoalMode;
    tdeeKcal?: number;
    tdeeSigmaKcal?: number;
    tdeeStatus?: TdeeStatus;
    explanation?: TargetsExplanation;
    summarySeen?: boolean;
  } = {},
): TargetsRecord {
  return new TargetsRecord({
    effectiveFrom,
    mode,
    tdeeKcal,
    tdeeSigmaKcal,
    tdeeStatus,
    targets: new DailyTargets({
      kcal,
      proteinG,
      proteinMinimumG,
      fatG,
      carbsG,
      weeklyRateFraction,
      ...(flags === undefined ? {} : { flags }),
    }),
    explanation,
    ...(summarySeen === undefined ? {} : { summarySeen }),
  });
}
