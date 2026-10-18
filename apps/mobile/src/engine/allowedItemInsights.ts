import type { InsightSwitches } from '../domain/InsightSwitches';
import { InsightPriority } from './InsightPriority';
import { InsightSnooze } from './InsightSnooze';
import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightSafeguards } from './InsightSafeguards';
import { ItemAnchor } from './ItemAnchor';
import type { ItemInsight } from './ItemInsight';
import { ItemInsightKind } from './ItemInsightKind';

/**
 * The inline insights to show, every one that holds on an item, by the
 * item's key (`ItemAnchor.key`) (MM-362, MM-393).
 *
 * None under 18, while coaching is paused, or with all insights switched
 * off. Otherwise an insight is left out when its kind is unknown, withheld
 * for the person's health answers, switched off itself or by its area, or
 * snoozed on its item (MM-378).
 * Several on one item are listed the higher priority first, then in the
 * order of `kinds` (the owner, 2026-10-18: one rule never hides another).
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
}): ReadonlyMap<string, readonly ItemInsight[]> {
  const shown = new Map<string, ItemInsight[]>();
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
    const held = shown.get(key) ?? [];
    // A rule that holds twice on one item (it should not) is said once.
    if (held.some((h) => h.kind === insight.kind)) continue;
    shown.set(key, [...held, insight]);
  }
  for (const held of shown.values()) {
    held.sort((a, b) => {
      const [pa, ia] = rank(a);
      const [pb, ib] = rank(b);
      return pa - pb || ia - ib;
    });
  }
  return shown;
}
