import type { WeighInBasis } from './WeighInBasis';

/**
 * The one imported weigh-in that counts for a day (MM-71), with where it
 * came from and why it was the one.
 */
export interface DayWeighIn {
  /** Midnight, local time, at the start of the day it counts for. */
  readonly day: Date;
  readonly kg: number;
  readonly basis: WeighInBasis;

  /**
   * The source of the readings it was chosen among: one name, or "several
   * sources" for a middle value taken across more than one.
   */
  readonly sourceName: string;

  /** How many readings it was chosen among. */
  readonly readings: number;

  /**
   * When the reading was taken, for the first of the morning. A middle
   * value has no time of its own.
   */
  readonly at?: Date | undefined;
}
