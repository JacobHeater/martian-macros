import type { GoalMode } from '../domain';

const labels: Readonly<Record<GoalMode, string>> = {
  fatLoss: 'Fat loss',
  recomp: 'Recomp',
  leanGain: 'Lean gain',
  maintenance: 'Maintenance',
};

export const goalModeLabel = (mode: GoalMode): string => labels[mode];
