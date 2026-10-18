import type { InsightArea } from '../domain/InsightArea';
import type { InsightPriority } from './InsightPriority';
import type { InsightSafeguards } from './InsightSafeguards';

/**
 * One kind of inline insight (MM-362): one rule of an area's catalog
 * (MM-365 to MM-368), with the title and example Settings > Coach lists it
 * by (MM-364).
 */
export interface ItemInsightKind {
  /** Stable: switches are stored by it. */
  readonly id: string;
  readonly area: InsightArea;
  readonly title: string;
  readonly example: string;
  /** Settles which insight an item shows when two fire (MM-141's order). */
  readonly priority: InsightPriority;
  /** Mentions weight, so never shown with weight hidden or an eating-disorder history. */
  readonly aboutWeight?: boolean;
  /** About food composition or intake other than protein and logging (MM-141), so never shown with an eating-disorder history. */
  readonly notWithEatingDisorderHistory?: boolean;
}

export const ItemInsightKind = {
  /**
   * Left out for the person's health answers: never shown, and never offered
   * as a switch (MM-364).
   */
  withheld(kind: ItemInsightKind, safeguards: InsightSafeguards): boolean {
    const weight = kind.aboutWeight === true;
    if (safeguards.eatingDisorderHistory && (weight || kind.notWithEatingDisorderHistory === true)) return true;
    return safeguards.weightHidden && weight;
  },
} as const;
