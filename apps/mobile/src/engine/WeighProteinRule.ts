import type { GoalMode } from '../domain/GoalMode';

/**
 * When the coach asks a hand-portion logger to weigh their main protein
 * food for a week (MM-46). Product judgement: tune it here.
 */
export const WeighProteinRule = {
  /** More of the fortnight's protein than this was logged by palm. */
  palmProteinShare: 0.5,

  /**
   * The goals in which protein precision matters: keeping or building
   * muscle. In maintenance a palm is close enough.
   */
  modes: ['fatLoss', 'recomp', 'leanGain'] as readonly GoalMode[],
} as const;
