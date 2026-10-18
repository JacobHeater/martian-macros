import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { recentInlineInsights } from '../engine/recentInlineInsights';
import type { RecentInsight } from './RecentInsight';
import { useInsightKinds } from './useInsightKinds';

/**
 * The inline insights of the last 14 days as the Coach tab lists them
 * (MM-363), or undefined while the app has no kinds of inline insight,
 * so the section is not shown at all.
 */
export function useRecentInsights(): readonly RecentInsight[] | undefined {
  const { state } = useApp();
  const kinds = useInsightKinds();
  const log = useLoaded(state.inlineInsightLog);
  const safeguards = useCell(state.insightSafeguards);
  const switches = useLoaded(state.insightSwitches);
  const current = useCell(state.itemInsights);
  if (kinds.length === 0) return undefined;
  if (log === undefined || safeguards === undefined || switches === undefined) return [];
  return recentInlineInsights({ log, kinds, safeguards, switches, current }).map(({ entry, changed }) => ({
    area: entry.area,
    item: entry.item,
    day: entry.firstShownOn,
    line: entry.line,
    changed,
    workoutId: entry.anchor.kind === 'exercise' ? Number(entry.anchor.id.split(':')[0]) : undefined,
  }));
}
