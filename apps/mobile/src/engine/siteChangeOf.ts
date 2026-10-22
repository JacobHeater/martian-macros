import type { CalendarDate } from '../domain/CalendarDate';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import type { SiteObservation } from '../domain/measurements/SiteObservation';
import { WaistObservation } from '../domain/WaistObservation';
import type { WaistChange } from './WaistChange';
import { waistChangeOf } from './waistChangeOf';

/**
 * Whether `site` changed over the `days` up to `asOf` (MM-156), by the one
 * rule every feature uses for the waist (MM-155): the middle of three
 * entries at each end, a change only beyond the noise of a difference. Each
 * site has its own noise figure (`MeasurementSite.facts`), half as much again
 * when either of the two ends compared rests on a single reading; the waist keeps its own
 * figure, the user's once there is one. Undefined without an entry at both
 * ends to compare.
 */
export function siteChangeOf({
  measurements,
  site,
  asOf,
  days = 28,
  sinceStart = false,
}: {
  measurements: Iterable<SiteObservation>;
  site: MeasurementSite;
  asOf: CalendarDate;
  days?: number;
  sinceStart?: boolean;
}): WaistChange | undefined {
  const entries = [...measurements]
    .filter((o) => o.site === site)
    .map((o) => new WaistObservation({ date: o.date, waistCm: o.valueCm, readings: o.readings }));
  if (site === 'waist') return waistChangeOf({ waist: entries, asOf, days, sinceStart });
  // The single-reading factor is applied there, to the two ends compared only.
  return waistChangeOf({ waist: entries, asOf, days, sinceStart, siteNoiseCm: MeasurementSite.facts(site).noiseCm });
}
