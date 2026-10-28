import type { ItemAnchor } from '../engine/ItemAnchor';
import { ItemAnchor as Anchor } from '../engine/ItemAnchor';

/**
 * The day's inline food lines as the person's own model phrased them
 * (MM-687): waiting while the one pass for the day is asked, then each
 * line by its item and kind; an item with no line of the model's keeps the
 * built-in words.
 */
export interface InlineNarration {
  readonly waiting: boolean;
  readonly lines: ReadonlyMap<string, string>;
}

export const InlineNarration = {
  /** The key of one line: the item's anchor and the kind of insight. */
  keyOf(anchor: ItemAnchor, kind: string): string {
    return `${Anchor.key(anchor)}|${kind}`;
  },
} as const;
