import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightArea } from '../domain/InsightArea';

/** One inline insight as the Coach tab lists it afterwards (MM-363). */
export interface RecentInsight {
  readonly area: InsightArea;
  /** What it was said under ("Peanut butter, lunch"). */
  readonly item: string;
  /** The day it first showed. */
  readonly day: CalendarDate;
  readonly line: string;
  /** The item was deleted or edited since, so the row no longer leads back to it. */
  readonly changed?: boolean;
}
