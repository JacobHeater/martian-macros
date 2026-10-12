import type { UserSetup } from '../domain/UserSetup';
import type { CoachSnapshot } from './CoachSnapshot';
import { computeTargets } from './computeTargets';
import type { DailyTargets } from './DailyTargets';
import { TargetInputs } from './TargetInputs';

/**
 * What to show in place of targets during a pause (MM-148): maintenance,
 * whatever the goal, as a guide. It is never stored and nothing is judged
 * against it. A lean-gain surplus is suspended with everything else.
 */
export function pausedGuide({ setup, snapshot }: { setup: UserSetup; snapshot: CoachSnapshot }): DailyTargets {
  return computeTargets(
    new TargetInputs({
      sex: setup.profile.sex,
      heightCm: setup.profile.heightCm,
      trendWeightKg: snapshot.trendWeightKg,
      bodyFat: snapshot.bodyFat,
      mode: 'maintenance',
      trainingStatus: setup.trainingStatus,
      trainingDaysPerWeek: setup.trainingDaysPerWeek,
      policy: snapshot.policy,
      tdeeKcal: snapshot.tdee.kcal,
      bmrKcal: snapshot.bmrKcal,
    }),
  );
}
