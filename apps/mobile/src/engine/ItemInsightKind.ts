import type { Caution } from '../domain/Caution';
import type { InsightArea } from '../domain/InsightArea';
import type { InsightPriority } from './InsightPriority';
import type { InsightSafeguards } from './InsightSafeguards';

/**
 * One kind of inline insight (MM-362): one rule of an area's catalog
 * (MM-365 to MM-368), with the title and example Settings > Coach lists it
 * by (MM-364).
 */
export interface ItemInsightKind {
  /** Stable: switches and snoozes are stored by it. */
  readonly id: string;
  readonly area: InsightArea;
  readonly title: string;
  readonly example: string;
  /** Settles which insight an item shows when two fire (MM-141's order). */
  readonly priority: InsightPriority;
  /** Mentions weight, so never shown with weight hidden or an eating-disorder history. */
  readonly aboutWeight?: boolean;
  /**
   * About food composition, a portion, the body, or intake other than
   * protein and logging (MM-141), so never shown with an eating-disorder
   * history.
   */
  readonly notWithEatingDisorderHistory?: boolean;
  /** Not shown while the under-eating finding holds (MM-114; the panel's SA-4). */
  readonly notWhileUnderEating?: boolean;
  /** Not shown for a person with any of these cautions in their coaching policy. */
  readonly notWithCautions?: readonly Caution[];
}

export const ItemInsightKind = {
  /**
   * Left out for the person's health answers or state: never shown, and
   * never offered as a switch (MM-364).
   */
  withheld(kind: ItemInsightKind, safeguards: InsightSafeguards): boolean {
    const weight = kind.aboutWeight === true;
    if (safeguards.eatingDisorderHistory && (weight || kind.notWithEatingDisorderHistory === true)) return true;
    if (safeguards.weightHidden && weight) return true;
    if (safeguards.underEating && kind.notWhileUnderEating === true) return true;
    return (kind.notWithCautions ?? []).some((caution) => safeguards.cautions.has(caution));
  },
} as const;
