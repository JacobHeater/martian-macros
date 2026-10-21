import type { FallingLift } from './FallingLift';
import type { ReliefChoice } from './ReliefChoice';
import type { ReliefReason } from './ReliefReason';
import type { ReliefSignal } from './ReliefSignal';
import type { SleepAverage } from './SleepAverage';

/**
 * An offer to ease a deficit (MM-117, MM-135): because recovery is failing,
 * or because the deficit has run twelve unbroken weeks. Never an automatic
 * change: the user picks, and carrying on is one of the picks.
 */
export interface ReliefOffer {
  /** What brought the offer. */
  readonly reason: ReliefReason;

  /** What the coach would pick: a break or a slower pace. */
  readonly suggestion: ReliefChoice;

  /**
   * The pace one step gentler than the current one, as a fraction of body
   * weight a week; undefined when there is none to offer, and on the
   * long-deficit offer, whose answer is a rest, not a pace.
   */
  readonly slowerPace: number | undefined;

  /** Whole weeks of unbroken deficit so far. */
  readonly deficitWeeks: number;

  /** What made the offer: hard check-ins, falling lifts, short sleep, or more than one (MM-252, MM-77). */
  readonly signals: readonly ReliefSignal[];

  /** The lifts that are falling, when that is one of the signals; empty otherwise. */
  readonly fallingLifts: readonly FallingLift[];

  /**
   * Whether sleep has averaged under six hours: from the nights recorded
   * (MM-250) when there are enough, else from the hours typed at the hard
   * check-ins.
   */
  readonly shortSleep: boolean;

  /** The fourteen-night average the short-sleep signal rests on; undefined when the signal came from typed hours or is absent. */
  readonly sleepAverage: SleepAverage | undefined;
}
