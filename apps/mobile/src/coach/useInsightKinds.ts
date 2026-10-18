import type { ItemInsightKind } from '../engine/ItemInsightKind';
import { itemInsightKinds } from '../engine/itemInsightKinds';
import { useInsightPreview } from './useInsightPreview';

/** The kinds of inline insight to list: the app's own, or a design story's. */
export function useInsightKinds(): readonly ItemInsightKind[] {
  return useInsightPreview().kinds ?? itemInsightKinds;
}
