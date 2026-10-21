import type { CalendarDate } from '../../domain/CalendarDate';
import type { GoalMode } from '../../domain/GoalMode';
import type { LeanGainPace } from '../../domain/LeanGainPace';
import { DailyTargets } from '../../engine/DailyTargets';
import type { TargetFlag } from '../../engine/TargetFlag';
import type { TargetsExplanation } from '../../engine/TargetsExplanation';
import { TargetsRecord } from '../../engine/TargetsRecord';
import type { TdeeStatus } from '../../engine/TdeeStatus';

/** Targets in force from `effectiveFrom` for a story's scenario, with ordinary figures unless given (MM-321). */
export function storyTargets(
  effectiveFrom: CalendarDate,
  {
    kcal = 2400,
    proteinG = 170,
    proteinMinimumG,
    fatG = 70,
    carbsG = 250,
    weeklyRateFraction = -0.0075,
    flags = [],
    mode = 'fatLoss',
    tdeeKcal = 2700,
    tdeeSigmaKcal = 400,
    tdeeStatus = 'held',
    explanation,
    leanGainPace,
  }: {
    kcal?: number;
    proteinG?: number;
    proteinMinimumG?: number;
    fatG?: number;
    carbsG?: number;
    weeklyRateFraction?: number;
    flags?: readonly TargetFlag[];
    mode?: GoalMode;
    tdeeKcal?: number;
    tdeeSigmaKcal?: number;
    tdeeStatus?: TdeeStatus;
    explanation?: TargetsExplanation | undefined;
    leanGainPace?: LeanGainPace | undefined;
  } = {},
): TargetsRecord {
  return new TargetsRecord({
    effectiveFrom,
    mode,
    tdeeKcal,
    tdeeSigmaKcal,
    tdeeStatus,
    targets: new DailyTargets({ kcal, proteinG, proteinMinimumG, fatG, carbsG, weeklyRateFraction, flags: new Set(flags) }),
    explanation,
    leanGainPace,
  });
}
