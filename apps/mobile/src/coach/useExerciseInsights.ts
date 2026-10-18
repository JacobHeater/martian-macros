import { ItemAnchor } from '../engine/ItemAnchor';
import type { InlineInsightContent } from './InlineInsightContent';
import { useItemInsightContents } from './useItemInsightContents';

/** What the coach says under an exercise of a workout (MM-366), every line that holds (MM-393). */
export function useExerciseInsights(workoutId: number, exerciseId: string, exerciseName: string): readonly InlineInsightContent[] {
  return useItemInsightContents(ItemAnchor.exercise(workoutId, exerciseId), exerciseName);
}
