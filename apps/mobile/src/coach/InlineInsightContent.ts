import type { InsightArea } from '../domain/InsightArea';
import type { InlineInsightLogEntry } from '../engine/InlineInsightLogEntry';

/**
 * What an inline insight says (MM-362): its one line, the figures it rests
 * on (each a label and its value, shown one tap down), and the area and
 * rule it comes from, whose switch the insight leads to (MM-364).
 */
export interface InlineInsightContent {
  readonly line: string;
  readonly evidence: readonly (readonly [label: string, value: string])[];
  readonly area: InsightArea;
  /** The rule's title as Settings > Coach lists it. */
  readonly rule: string;
  /** What to log once it is shown, for the Coach tab (MM-363); a design's own lines have none. */
  readonly logged?: Omit<InlineInsightLogEntry, 'firstShownOn'>;
  /** What a snooze of it quiets (MM-378): the kind on this item, and the item's name for the Snoozed list. */
  readonly snooze?: { readonly kind: string; readonly subject: string; readonly item: string };
}
