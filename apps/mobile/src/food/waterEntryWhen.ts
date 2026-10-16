import type { WaterEntry } from '../domain/water/WaterEntry';
import { clockTimeText } from '../format/clockTimeText';

/**
 * When a drink was had, as far as the app knows (MM-319): its time when it
 * was logged on its own day, or "Added later" when it was logged on another
 * day, whose clock time says nothing about when it was drunk.
 */
export function waterEntryWhen(entry: WaterEntry): string {
  const at = entry.at;
  const sameDay =
    at.getFullYear() === entry.date.year && at.getMonth() + 1 === entry.date.month && at.getDate() === entry.date.day;
  return sameDay ? clockTimeText(at) : 'Added later';
}
