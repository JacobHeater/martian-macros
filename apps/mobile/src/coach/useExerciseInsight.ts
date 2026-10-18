import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { ItemAnchor } from '../engine/ItemAnchor';
import { itemInsightKinds } from '../engine/itemInsightKinds';
import { itemInsightText } from '../format/itemInsightText';
import type { InlineInsightContent } from './InlineInsightContent';

/**
 * What the coach says under an exercise of a workout (MM-362, MM-366), if
 * anything, ready to draw and to log once shown (MM-363).
 */
export function useExerciseInsight(workoutId: number, exerciseId: string, exerciseName: string): InlineInsightContent | undefined {
  const { state } = useApp();
  const anchor = ItemAnchor.exercise(workoutId, exerciseId);
  const insight = useCell(state.itemInsights).get(ItemAnchor.key(anchor));
  if (insight === undefined) return undefined;
  const kind = itemInsightKinds.find((k) => k.id === insight.kind);
  const text = itemInsightText(insight);
  if (kind === undefined || text === undefined) return undefined;
  return {
    line: text.line,
    evidence: text.evidence,
    area: kind.area,
    rule: kind.title,
    logged: { kind: kind.id, area: kind.area, anchor, item: exerciseName, line: text.line },
  };
}
