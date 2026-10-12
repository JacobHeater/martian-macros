import type { CalendarDate } from '../domain/CalendarDate';
import type { TargetsRecord } from './TargetsRecord';

/** Records a set of targets as issued. */
export interface TargetsHistoryWriter {
  /** Saves `record`; a record already effective from the same day is replaced. */
  saveTargets(record: TargetsRecord): Promise<void>;

  /** Marks summaries for target changes through `effectiveFrom` as shown. */
  markSummariesSeenThrough(effectiveFrom: CalendarDate): Promise<void>;
}
