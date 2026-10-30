import type { CalendarDate } from '../domain/CalendarDate';
import type { SavedFoodUsage } from '../domain/food/custom/SavedFoodUsage';
import { Fmt } from './Fmt';

/**
 * How often something was logged and when last, for a row in the Library
 * (MM-706): "Last logged 3 days ago · 12 times", "Last logged today · once",
 * "Never logged". An exercise says "Last trained … · 12 workouts".
 */
export function lastLoggedText(
  usage: SavedFoodUsage | undefined,
  today: CalendarDate,
  { did = 'logged', each = 'time' }: { did?: 'logged' | 'trained'; each?: 'time' | 'workout' } = {},
): string {
  if (usage === undefined) return `Never ${did}`;
  const ago = usage.lastDay.daysUntil(today);
  const when =
    ago <= 0
      ? 'today'
      : ago === 1
        ? 'yesterday'
        : ago < 14
          ? `${ago} days ago`
          : ago < 60
            ? `${Math.floor(ago / 7)} weeks ago`
            : Fmt.shortDay(usage.lastDay);
  const times = usage.times === 1 ? (each === 'time' ? 'once' : '1 workout') : `${usage.times} ${each}s`;
  return `Last ${did} ${when} · ${times}`;
}
