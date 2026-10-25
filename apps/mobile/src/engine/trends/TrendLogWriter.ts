import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendAnnouncement } from './TrendAnnouncement';

/** Records what the trend engine said, and the findings dismissed (MM-605). The log is append-only. */
export interface TrendLogWriter {
  /** Adds `entries` to the end of the log, in their order, together. */
  appendTrendAnnouncements(entries: readonly TrendAnnouncement[]): Promise<void>;

  /** Records that the finding `findingId` was dismissed on `day`. Dismissing it again on the same day changes nothing. */
  dismissFinding(findingId: string, day: CalendarDate): Promise<void>;
}
