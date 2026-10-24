import type { TrendAnnouncement } from './TrendAnnouncement';
import type { TrendTransition } from './TrendTransition';

/** The state machine's answer for one key and one day (MM-605). */
export interface TrendStep {
  readonly transition: TrendTransition;

  /** The entry to append to the announcement log, if any. */
  readonly append: TrendAnnouncement | undefined;

  /** Whether the person is told: new, update, reversed, back again, and resolved where it is good news. */
  readonly announced: boolean;
}
