import type { FoodEntry } from '../domain/FoodEntry';
import { mealLabel } from '../format/mealLabel';
import { InlineInsight } from './InlineInsight';
import type { InlineInsightContent } from './InlineInsightContent';
import { useItemInsightContents } from './useItemInsightContents';

interface FoodEntryInsightProps {
  entry: FoodEntry;
  /** A design story's own line for the entry, in place of the app's (MM-293). */
  preview?: InlineInsightContent | undefined;
}

/** The coach's lines under a logged food (MM-365), one per rule that holds, the higher priority first (MM-393). */
export function FoodEntryInsight({ entry, preview }: FoodEntryInsightProps) {
  const own = useItemInsightContents({ kind: 'foodEntry', id: `${entry.id}` }, `${entry.name}, ${mealLabel(entry.meal).toLowerCase()}`);
  const insights = preview === undefined ? own : [preview];
  return (
    <>
      {insights.map((insight) => (
        <InlineInsight key={insight.rule} insight={insight} />
      ))}
    </>
  );
}
