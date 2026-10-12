import type { ReliefChoice } from './ReliefChoice';

/**
 * An offer to ease a deficit because recovery is failing (MM-117). Never an
 * automatic change: the user picks, and carrying on is one of the picks.
 */
export interface ReliefOffer {
  /** What the coach would pick: a maintenance week or a slower pace. */
  readonly suggestion: ReliefChoice;

  /**
   * The pace one step gentler than the current one, as a fraction of body
   * weight a week; undefined when there is none to offer.
   */
  readonly slowerPace: number | undefined;

  /** Whole weeks of unbroken deficit so far. */
  readonly deficitWeeks: number;

  /** Whether reported sleep has averaged under six hours. */
  readonly shortSleep: boolean;
}
