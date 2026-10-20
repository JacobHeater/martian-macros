import type { ReliefChoice } from './ReliefChoice';
import type { ReliefSignal } from './ReliefSignal';
import type { SleepAverage } from './SleepAverage';

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

  /** What made the offer: hard check-ins, short sleep, or both (MM-252). */
  readonly signals: readonly ReliefSignal[];

  /**
   * Whether sleep has averaged under six hours: from the nights recorded
   * (MM-250) when there are enough, else from the hours typed at the hard
   * check-ins.
   */
  readonly shortSleep: boolean;

  /** The fourteen-night average the short-sleep signal rests on; undefined when the signal came from typed hours or is absent. */
  readonly sleepAverage: SleepAverage | undefined;
}
