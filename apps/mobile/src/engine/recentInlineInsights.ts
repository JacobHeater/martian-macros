import type { InsightSwitches } from '../domain/InsightSwitches';
import type { CalendarDate } from '../domain/CalendarDate';
import type { InlineInsightLogEntry } from './InlineInsightLogEntry';
import { InsightSnooze } from './InsightSnooze';
import type { InsightSafeguards } from './InsightSafeguards';
import { ItemAnchor } from './ItemAnchor';
import type { ItemInsight } from './ItemInsight';
import { ItemInsightKind } from './ItemInsightKind';
import { snoozeSubjectOf } from './snoozeSubjectOf';

/**
 * The inline insights shown, as the Coach tab lists them (MM-363): those the
 * safeguards, switches and snoozes (MM-378) would still show today, each marked changed when
 * its item no longer carries it, because the item was deleted or edited so
 * the kind no longer holds. A changed one keeps the words it was said in.
 */
export function recentInlineInsights({
  log,
  kinds,
  safeguards,
  switches,
  current,
  snoozes = [],
  today,
}: {
  log: readonly InlineInsightLogEntry[];
  kinds: readonly ItemInsightKind[];
  safeguards: InsightSafeguards;
  switches: InsightSwitches;
  snoozes?: readonly InsightSnooze[];
  today: CalendarDate;
  /** What items carry now, by item key (`allowedItemInsights`). */
  current: ReadonlyMap<string, ItemInsight>;
}): { entry: InlineInsightLogEntry; changed: boolean }[] {
  if (!safeguards.adult || safeguards.paused || !switches.all) return [];
  const byId = new Map(kinds.map((kind) => [kind.id, kind]));
  const quiet = new Set(snoozes.filter((s) => InsightSnooze.quietOn(s, today)).map((s) => InsightSnooze.key(s.kind, s.subject)));
  return log.flatMap((entry) => {
    const kind = byId.get(entry.kind);
    if (kind === undefined || ItemInsightKind.withheld(kind, safeguards)) return [];
    if (switches.offAreas.has(kind.area) || switches.offKinds.has(kind.id)) return [];
    if (quiet.has(InsightSnooze.key(entry.kind, snoozeSubjectOf(entry)))) return [];
    return [{ entry, changed: current.get(ItemAnchor.key(entry.anchor))?.kind !== entry.kind }];
  });
}
