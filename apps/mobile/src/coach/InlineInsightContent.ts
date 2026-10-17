import type { InsightArea } from '../domain/InsightArea';

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
}
