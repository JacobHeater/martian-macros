import { ItemAnchor } from '../engine/ItemAnchor';
import type { InlineInsightContent } from './InlineInsightContent';
import { useItemInsightContent } from './useItemInsightContent';

/** What the coach says under an exercise of a workout (MM-366), if anything. */
export function useExerciseInsight(workoutId: number, exerciseId: string, exerciseName: string): InlineInsightContent | undefined {
  return useItemInsightContent(ItemAnchor.exercise(workoutId, exerciseId), exerciseName);
}
