import { CalendarDate } from '../domain/CalendarDate';
import type { MenstruationDay } from '../domain/MenstruationDay';
import type { HealthSample } from '../healthIngest/HealthSample';

/**
 * The days of menstrual flow the trend works from (MM-68, MM-19): the days
 * the person marked, and every day the health platform recorded flow on,
 * each once, oldest first.
 *
 * A day recorded on the platform is the local day its reading was taken;
 * one dated after `today` is left out, as a marked one cannot be.
 */
export function mergeFlowDays({
  typed,
  imported,
  today,
}: {
  typed: readonly MenstruationDay[];
  imported: readonly HealthSample[];
  today: CalendarDate;
}): MenstruationDay[] {
  const days = new Map<number, CalendarDate>();
  for (const day of typed) days.set(day.date.epochDay, day.date);
  for (const sample of imported) {
    if (sample.type !== 'menstruation') continue;
    const date = CalendarDate.fromDate(sample.start);
    if (date.isAfter(today)) continue;
    days.set(date.epochDay, date);
  }
  return [...days.values()].sort((a, b) => a.compareTo(b)).map((date) => ({ date }));
}
