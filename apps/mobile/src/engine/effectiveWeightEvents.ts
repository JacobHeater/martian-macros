import type { WeightEvent } from '../domain/WeightEvent';
import { WeightEventType } from '../domain/WeightEventType';
import { isCreatineShift } from './isCreatineShift';

/**
 * At most two transient events in each chronological 14-day window affect
 * the trend. Newest entries beyond that cap remain stored for the UI.
 */
export function effectiveWeightEvents(events: Iterable<WeightEvent>): WeightEvent[] {
  const order = (type: WeightEventType) => WeightEventType.values.indexOf(type);
  const sorted = [...events].sort((a, b) => {
    const byDate = a.date.compareTo(b.date);
    return byDate !== 0 ? byDate : order(a.type) - order(b.type);
  });
  const accepted: WeightEvent[] = [];
  for (const event of sorted) {
    if (isCreatineShift(event.type)) continue;
    const recentCount = accepted.filter((prior) => prior.date.daysUntil(event.date) < 14).length;
    if (recentCount < 2) accepted.push(event);
  }
  return accepted;
}
