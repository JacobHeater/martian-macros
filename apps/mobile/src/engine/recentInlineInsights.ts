import type { InsightSwitches } from '../domain/InsightSwitches';
import type { InlineInsightLogEntry } from './InlineInsightLogEntry';
import type { InsightSafeguards } from './InsightSafeguards';
import { ItemAnchor } from './ItemAnchor';
import type { ItemInsight } from './ItemInsight';
import { ItemInsightKind } from './ItemInsightKind';

/**
 * The inline insights shown, as the Coach tab lists them (MM-363): those the
 * safeguards and switches would still show today, each marked changed when
 * its item no longer carries it, because the item was deleted or edited so
 * the kind no longer holds. A changed one keeps the words it was said in.
 */
export function recentInlineInsights({
  log,
  kinds,
  safeguards,
  switches,
  current,
}: {
  log: readonly InlineInsightLogEntry[];
  kinds: readonly ItemInsightKind[];
  safeguards: InsightSafeguards;
  switches: InsightSwitches;
  /** What items carry now, by item key (`allowedItemInsights`). */
  current: ReadonlyMap<string, ItemInsight>;
}): { entry: InlineInsightLogEntry; changed: boolean }[] {
  if (!safeguards.adult || safeguards.paused || !switches.all) return [];
  const byId = new Map(kinds.map((kind) => [kind.id, kind]));
  return log.flatMap((entry) => {
    const kind = byId.get(entry.kind);
    if (kind === undefined || ItemInsightKind.withheld(kind, safeguards)) return [];
    if (switches.offAreas.has(kind.area) || switches.offKinds.has(kind.id)) return [];
    return [{ entry, changed: current.get(ItemAnchor.key(entry.anchor))?.kind !== entry.kind }];
  });
}
