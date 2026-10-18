import type { InsightSwitches } from '../domain/InsightSwitches';
import { InsightPriority } from './InsightPriority';
import { InsightSnooze } from './InsightSnooze';
import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightSafeguards } from './InsightSafeguards';
import { ItemAnchor } from './ItemAnchor';
import type { ItemInsight } from './ItemInsight';
import { ItemInsightKind } from './ItemInsightKind';

/**
 * The inline insights to show, one per item, by the item's key
 * (`ItemAnchor.key`) (MM-362).
 *
 * None under 18, while coaching is paused, or with all insights switched
 * off. Otherwise an insight is left out when its kind is unknown, withheld
 * for the person's health answers, switched off itself or by its area, or
 * snoozed on its item (MM-378).
 * When two remain on one item the higher priority wins, then the one
 * listed first in `kinds`.
 */
export function allowedItemInsights({
  insights,
  kinds,
  safeguards,
  switches,
  snoozes = [],
  today,
}: {
  insights: readonly ItemInsight[];
  kinds: readonly ItemInsightKind[];
  safeguards: InsightSafeguards;
  switches: InsightSwitches;
  snoozes?: readonly InsightSnooze[];
  today: CalendarDate;
}): ReadonlyMap<string, ItemInsight> {
  const shown = new Map<string, ItemInsight>();
  if (!safeguards.adult || safeguards.paused || !switches.all) return shown;
  const byId = new Map(kinds.map((kind, index) => [kind.id, { kind, index }]));
  const quiet = new Set(snoozes.filter((s) => InsightSnooze.quietOn(s, today)).map((s) => InsightSnooze.key(s.kind, s.subject)));
  const rank = (insight: ItemInsight): readonly [priority: number, place: number] => {
    const known = byId.get(insight.kind);
    return known === undefined ? [Infinity, Infinity] : [InsightPriority.index(known.kind.priority), known.index];
  };
  for (const insight of insights) {
    const kind = byId.get(insight.kind)?.kind;
    if (kind === undefined) continue;
    if (ItemInsightKind.withheld(kind, safeguards)) continue;
    if (switches.offAreas.has(kind.area) || switches.offKinds.has(kind.id)) continue;
    if (quiet.has(InsightSnooze.key(insight.kind, insight.subject))) continue;
    const key = ItemAnchor.key(insight.anchor);
    const held = shown.get(key);
    if (held !== undefined) {
      const [p, i] = rank(insight);
      const [heldP, heldI] = rank(held);
      if (p > heldP || (p === heldP && i >= heldI)) continue;
    }
    shown.set(key, insight);
  }
  return shown;
}
