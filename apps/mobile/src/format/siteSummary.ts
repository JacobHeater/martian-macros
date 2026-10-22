import type { CalendarDate } from '../domain/CalendarDate';
import type { MeasurementSite } from '../domain/measurements/MeasurementSite';
import type { SiteObservation } from '../domain/measurements/SiteObservation';
import type { MeasuredChange } from '../engine/MeasuredChange';
import { siteChangeOf } from '../engine/siteChangeOf';
import { Fmt } from './Fmt';
import { siteAmount } from './siteAmount';

/**
 * One site's line (MM-156), as the waist's (MM-155): the latest
 * measurement and whether it has changed since the start by the shared
 * rule, with that site's noise. "Not measured yet." before the first.
 */
export function siteSummary(
  measurements: readonly SiteObservation[],
  site: MeasurementSite,
  fmt: Fmt,
  today: CalendarDate,
): string {
  const own = measurements.filter((o) => o.site === site);
  const latest = own[own.length - 1];
  if (latest === undefined) return 'Not measured yet.';
  const base = `Latest: ${fmt.length(latest.valueCm)} on ${Fmt.shortDay(latest.date)}.`;
  if (own.length < 2) return base;
  const change = siteChangeOf({ measurements: own, site, asOf: today, sinceStart: true });
  if (change === undefined) return `${base} Measure again to see how it has changed.`;
  const since: Readonly<Record<MeasuredChange, string>> = {
    down: `Down ${siteAmount(change.changeCm, fmt)} since you started.`,
    up: `Up ${siteAmount(change.changeCm, fmt)} since you started.`,
    noClearChange: `No clear change since you started: under ${siteAmount(change.thresholdCm, fmt)} is within what a tape can tell.`,
  };
  return `${base} ${since[change.direction]}`;
}
