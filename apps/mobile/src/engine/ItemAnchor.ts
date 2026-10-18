import type { ItemAnchorKind } from './ItemAnchorKind';

/**
 * The item an inline insight is about (MM-362): its kind and an id that
 * names it among items of that kind. An exercise of a workout is named
 * by the workout's id and the exercise's (`exerciseAnchor`).
 */
export interface ItemAnchor {
  readonly kind: ItemAnchorKind;
  readonly id: string;
}

export const ItemAnchor = {
  /** One string per item, to key maps by. */
  key(anchor: ItemAnchor): string {
    return `${anchor.kind}:${anchor.id}`;
  },

  /** An exercise as it was done in one workout. */
  exercise(workoutId: number, exerciseId: string): ItemAnchor {
    return { kind: 'exercise', id: `${workoutId}:${exerciseId}` };
  },
} as const;
