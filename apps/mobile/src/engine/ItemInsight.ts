import type { CalendarDate } from '../domain/CalendarDate';
import type { ItemAnchor } from './ItemAnchor';

/**
 * One thing the coach noticed about one logged item (MM-362), beside the
 * dashboard's `Insight` (MM-141), which is about a stretch of days. The
 * words are fixed templates filled from `figures`; nothing is generated.
 */
export interface ItemInsight {
  /** The id of the kind of insight (`ItemInsightKind.id`) that produced it. */
  readonly kind: string;
  readonly anchor: ItemAnchor;
  /** About the item alone, or about a pattern the item is part of. */
  readonly basis: 'item' | 'pattern';
  /** The observed numbers, by name, shown as "The numbers behind this". */
  readonly figures: Readonly<Record<string, number>>;
  /** For a pattern, the days it was worked out from. */
  readonly from?: CalendarDate | undefined;
  readonly to?: CalendarDate | undefined;
}
