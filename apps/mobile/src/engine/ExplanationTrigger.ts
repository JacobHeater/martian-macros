const values = [
  'firstTargets',
  'checkIn',
  'goalChange',
  'profileCorrection',
  'appRuleUpdate',
  'healthRule',
  'underweightRule',
  'bodyFatCorrection',
  /** The user chose a different fat-loss pace (MM-128). */
  'paceChange',
  /** The training-days setting went to zero on a gain (MM-134). */
  'trainingLapse',
] as const;

/**
 * What caused targets to be issued, which names the leftover cause of a
 * change once expenditure and the limits are accounted for.
 */
export type ExplanationTrigger = (typeof values)[number];

export const ExplanationTrigger = { values } as const;
