import type { CalendarDate } from '../../domain/CalendarDate';
import { InsightSnooze } from '../InsightSnooze';
import { itemInsightKinds } from '../itemInsightKinds';

/** The kinds of inline insight about a food, whose snooze names the food (`InsightSnooze.subject`). */
const foodKinds = new Set(itemInsightKinds.filter((kind) => kind.area === 'food').map((kind) => kind.id));

/**
 * The foods the person snoozed an inline insight on (MM-378), quiet on
 * `today`, by name trimmed and in lower case, as the trades key them
 * (MM-607's `TradeInput.snoozed`): never an X or a Y of a trade.
 */
export function snoozedFoodNames(snoozes: readonly InsightSnooze[], today: CalendarDate): ReadonlySet<string> {
  const names = new Set<string>();
  for (const snooze of snoozes) {
    if (foodKinds.has(snooze.kind) && InsightSnooze.quietOn(snooze, today)) names.add(snooze.subject.trim().toLowerCase());
  }
  return names;
}
