import type { GoalMode } from '../domain';

const blurbs: Readonly<Record<GoalMode, string>> = {
  fatLoss: 'Lose fat at a steady pace while keeping muscle.',
  recomp: 'Hold weight roughly steady while trading fat for muscle.',
  leanGain: 'Build muscle in a small, controlled surplus.',
  maintenance: 'Hold where you are.',
};

export const goalModeBlurb = (mode: GoalMode): string => blurbs[mode];
