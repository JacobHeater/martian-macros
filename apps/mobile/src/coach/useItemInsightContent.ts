import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import type { ItemAnchor } from '../engine/ItemAnchor';
import { ItemAnchor as Anchor } from '../engine/ItemAnchor';
import { itemInsightKinds } from '../engine/itemInsightKinds';
import { Fmt } from '../format/Fmt';
import { itemInsightText } from '../format/itemInsightText';
import type { InlineInsightContent } from './InlineInsightContent';

/**
 * What the coach says under one item (MM-362), if anything, ready to draw,
 * to log once shown (MM-363) and to snooze (MM-378). `item` is what the
 * item is called where the line is listed afterwards.
 */
export function useItemInsightContent(anchor: ItemAnchor, item: string): InlineInsightContent | undefined {
  const { state } = useApp();
  const insight = useCell(state.itemInsights).get(Anchor.key(anchor));
  const units = useLoaded(state.setup)?.unitSystem ?? 'metric';
  if (insight === undefined) return undefined;
  const kind = itemInsightKinds.find((k) => k.id === insight.kind);
  const text = itemInsightText(insight, new Fmt(units));
  if (kind === undefined || text === undefined) return undefined;
  return {
    line: text.line,
    evidence: text.evidence,
    area: kind.area,
    rule: kind.title,
    logged: { kind: kind.id, area: kind.area, anchor, item, line: text.line },
    snooze: { kind: kind.id, subject: insight.subject, item },
  };
}
