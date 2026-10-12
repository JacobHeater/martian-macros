import type { CalendarDate } from '../domain/CalendarDate';
import { ReportPeriod } from './ReportPeriod';

/**
 * The monthly reports available on `today`, oldest first (MM-33): every
 * 28-day span since `onboardedOn` that has finished. A span in progress has
 * no report yet.
 */
export function reportPeriods({
  onboardedOn,
  today,
}: {
  onboardedOn: CalendarDate;
  today: CalendarDate;
}): ReportPeriod[] {
  const periods: ReportPeriod[] = [];
  for (let index = 0; ; index++) {
    const period = new ReportPeriod({ index, from: onboardedOn.addDays(index * ReportPeriod.days) });
    if (period.readyOn.isAfter(today)) break;
    periods.push(period);
  }
  return periods;
}
