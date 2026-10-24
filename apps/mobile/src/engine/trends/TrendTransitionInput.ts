import type { TrendAnnouncement } from './TrendAnnouncement';
import type { TrendReading } from './TrendReading';

/** What the state machine reads for one key (MM-605, `nextTrendTransition`). */
export interface TrendTransitionInput {
  /** The key's announcement log, oldest first. */
  readonly log: readonly TrendAnnouncement[];

  /** The key's readings as of E (yesterday), E−1 and E−2. */
  readonly asOf: TrendReading;
  readonly dayBefore: TrendReading;
  readonly twoDaysBefore: TrendReading;

  /** The signal's `resolutionIsGoodNews`. */
  readonly resolutionIsGoodNews: boolean;

  /** Recorded on the entry; `TrendRule.rulesVersion` when left out. */
  readonly rulesVersion?: number | undefined;
}
