import type { Watched } from '../../lang/Watched';
import type { FindingDismissal } from './FindingDismissal';
import type { TrendAnnouncement } from './TrendAnnouncement';

/** Reads what the trend engine said, and which findings were dismissed (MM-605). */
export interface TrendLogReader {
  /** The announcement log, oldest first (by day, then in the order appended), then the full list after each change. */
  watchTrendAnnouncements(): Watched<TrendAnnouncement[]>;

  /** Every dismissal, oldest first (by day, then in the order made), then the full list after each change. */
  watchFindingDismissals(): Watched<FindingDismissal[]>;
}
