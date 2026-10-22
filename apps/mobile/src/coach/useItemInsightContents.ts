import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import type { ItemAnchor } from '../engine/ItemAnchor';
import { ItemAnchor as Anchor } from '../engine/ItemAnchor';
import type { ItemInsight } from '../engine/ItemInsight';
import { itemInsightKinds } from '../engine/itemInsightKinds';
import { Fmt } from '../format/Fmt';
import { itemInsightText } from '../format/itemInsightText';
import type { InlineInsightContent } from './InlineInsightContent';

const none: readonly ItemInsight[] = [];

/**
 * What the coach says under one item (MM-362), every line that holds, the
 * higher priority first (MM-393), each ready to draw, to log once shown
 * (MM-363) and to snooze (MM-378). `item` is what the item is called where
 * the line is listed afterwards.
 */
export function useItemInsightContents(anchor: ItemAnchor, item: string): readonly InlineInsightContent[] {
  const { state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const insights = useCell(state.itemInsights).get(Anchor.key(anchor)) ?? none;
  const units = useLoaded(state.setup)?.unitSystem ?? 'metric';
  return insights.flatMap((insight) => {
    const kind = itemInsightKinds.find((k) => k.id === insight.kind);
    const text = itemInsightText(insight, new Fmt(units, { weightDisplay }));
    if (kind === undefined || text === undefined) return [];
    return [
      {
        line: text.line,
        evidence: text.evidence,
        area: kind.area,
        rule: kind.title,
        logged: { kind: kind.id, area: kind.area, anchor, item, line: text.line },
        snooze: { kind: kind.id, subject: insight.subject, item },
      },
    ];
  });
}
