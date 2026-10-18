import type { FoodEntry } from '../domain/FoodEntry';
import { mealLabel } from '../format/mealLabel';
import { InlineInsight } from './InlineInsight';
import type { InlineInsightContent } from './InlineInsightContent';
import { useItemInsightContent } from './useItemInsightContent';

interface FoodEntryInsightProps {
  entry: FoodEntry;
  /** A design story's own line for the entry, in place of the app's (MM-293). */
  preview?: InlineInsightContent | undefined;
}

/** The coach's line under a logged food (MM-365), when it has one. */
export function FoodEntryInsight({ entry, preview }: FoodEntryInsightProps) {
  const own = useItemInsightContent({ kind: 'foodEntry', id: `${entry.id}` }, `${entry.name}, ${mealLabel(entry.meal).toLowerCase()}`);
  const insight = preview ?? own;
  return insight === undefined ? null : <InlineInsight insight={insight} />;
}
