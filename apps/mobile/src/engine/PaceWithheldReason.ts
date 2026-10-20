/** Why a pace is not offered (MM-128). */
export type PaceWithheldReason =
  /** The body-fat limit on the pace of loss rules it out (MM-28). */
  | 'bodyFat'
  /** Faster needs clearly high body fat; this person's is not. */
  | 'notLeanEnoughForFaster'
  /** A caution from the health check or age allows only the gentle pace (MM-111, MM-112). */
  | 'caution';
