const values = [
  /** No structured resistance training. */
  'untrained',
  /** Under one year of consistent training. */
  'novice',
  /** Previously trained, back after a layoff of six months or more. */
  'returning',
  'intermediate',
  'advanced',
] as const;

/**
 * Resistance-training background, which drives recomp eligibility and the
 * lean/fat partition of weight change.
 */
export type TrainingStatus = (typeof values)[number];

export const TrainingStatus = {
  values,

  isResistanceTrained(status: TrainingStatus): boolean {
    return status !== 'untrained';
  },
} as const;
