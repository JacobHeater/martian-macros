import type { CalendarDate } from '../domain/CalendarDate';
import { healthWritePrefix } from '../healthIngest/healthWritePrefix';

/**
 * The id a typed weigh-in is written to the health platform under
 * (MM-513): the app keeps one weigh-in a day, so its day is its id, found
 * again to replace or remove it. The namespace keeps it apart from what was
 * written before an erase (MM-522).
 */
export function weightRecordId(namespace: string, date: CalendarDate): string {
  return `${healthWritePrefix.weight}${namespace}-${date.toString()}`;
}
