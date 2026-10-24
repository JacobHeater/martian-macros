import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendDay } from './TrendDay';

/**
 * The 7-day blocks of `days` ending on `asOf` and going back, whole blocks
 * only and none starting before `from`, most recent first (MM-605, D5).
 * Every block holds each day of the week once. `days` is one entry per
 * calendar day, ascending, and ends on `asOf`.
 */
export function weekBlocksOf(days: readonly TrendDay[], from: CalendarDate, asOf: CalendarDate): (readonly TrendDay[])[] {
  const blocks: (readonly TrendDay[])[] = [];
  const last = days.length - 1;
  for (let end = asOf; !end.addDays(-6).isBefore(from); end = end.addDays(-7)) {
    const endAt = last - end.daysUntil(asOf);
    const startAt = endAt - 6;
    if (startAt < 0) break;
    blocks.push(days.slice(startAt, endAt + 1));
  }
  return blocks;
}
