import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightArea } from '../domain/InsightArea';
import type { ItemAnchor } from './ItemAnchor';

/**
 * An inline insight as it was shown (MM-363): its kind and area, the item
 * it was under, what that item was called and what was said, as they were
 * then, and the day it first showed. One per kind per item.
 */
export interface InlineInsightLogEntry {
  readonly kind: string;
  readonly area: InsightArea;
  readonly anchor: ItemAnchor;
  /** What it was said under ("Bench press"). */
  readonly item: string;
  readonly line: string;
  readonly firstShownOn: CalendarDate;
}
