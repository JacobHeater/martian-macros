import type { GoalMode } from '../domain/GoalMode';

/**
 * The plain note under Lean gain and Recomp for someone who does not train
 * yet (MM-134).
 */
export function trainingGoalNote(goal: GoalMode): string | undefined {
  if (goal !== 'leanGain' && goal !== 'recomp') return undefined;
  return 'This goal works through resistance training. Without it, a surplus is stored as fat.';
}
