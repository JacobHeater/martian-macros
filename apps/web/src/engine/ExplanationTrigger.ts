const values = [
  'firstTargets',
  'checkIn',
  'goalChange',
  'profileCorrection',
  'appRuleUpdate',
  'healthRule',
  'underweightRule',
  'bodyFatCorrection',
] as const;

/**
 * What caused targets to be issued, which names the leftover cause of a
 * change once expenditure and the limits are accounted for.
 */
export type ExplanationTrigger = (typeof values)[number];

export const ExplanationTrigger = { values } as const;
