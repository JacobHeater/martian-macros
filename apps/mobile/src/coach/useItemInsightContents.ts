import { useContext } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import type { ItemAnchor } from '../engine/ItemAnchor';
import { ItemAnchor as Anchor } from '../engine/ItemAnchor';
import type { ItemInsight } from '../engine/ItemInsight';
import { Fmt } from '../format/Fmt';
import type { InlineInsightContent } from './InlineInsightContent';
import { inlineInsightContentOf } from './inlineInsightContentOf';
import { InlineNarrationContext } from './InlineNarrationContext';
import { InlineNarration } from './InlineNarration';

const none: readonly ItemInsight[] = [];

/**
 * What the coach says under one item (MM-362, MM-666), every line that holds,
 * the higher priority first (MM-393), each ready to draw, to log once shown
 * (MM-363) and to snooze (MM-378); a food's line ends in its move (MM-684).
 * Under a day whose lines the person's own model phrases (MM-687), the line
 * waits while the day's pass is asked, and is the model's once it is in.
 */
export function useItemInsightContents(anchor: ItemAnchor, item: string): readonly InlineInsightContent[] {
  const { state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const insights = useCell(state.itemInsights).get(Anchor.key(anchor)) ?? none;
  const units = useLoaded(state.setup)?.unitSystem ?? 'metric';
  const foodInput = useCell(state.coachAnalysis.foodInput);
  const narration = useContext(InlineNarrationContext);
  const fmt = new Fmt(units, { weightDisplay });
  return insights.flatMap((insight) => {
    const content = inlineInsightContentOf(insight, anchor, item, fmt, foodInput);
    if (content === undefined) return [];
    if (narration === undefined || anchor.kind !== 'foodEntry') return [content];
    if (narration.waiting) return [{ ...content, waiting: true }];
    const line = narration.lines.get(InlineNarration.keyOf(anchor, insight.kind));
    if (line === undefined) return [content];
    return [{ ...content, line, ...(content.logged === undefined ? {} : { logged: { ...content.logged, line } }) }];
  });
}
