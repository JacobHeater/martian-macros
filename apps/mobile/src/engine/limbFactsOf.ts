import type { CalendarDate } from '../domain/CalendarDate';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import type { SiteObservation } from '../domain/measurements/SiteObservation';
import type { LimbFact } from './LimbFact';
import { siteChangeOf } from './siteChangeOf';

/** Twelve weeks: a limb changes slowly, and over less a tape says nothing. */
const limbWindowDays = 84;

/**
 * What each measured limb did over the last twelve weeks, beside the waist
 * (MM-156): for a limb with a measurement at both ends, its change and the
 * waist's over the same days.
 */
export function limbFactsOf({
  measurements,
  sites,
  asOf,
}: {
  measurements: readonly SiteObservation[];
  sites: ReadonlySet<MeasurementSite>;
  asOf: CalendarDate;
}): LimbFact[] {
  const waist = siteChangeOf({ measurements, site: 'waist', asOf, days: limbWindowDays });
  const facts: LimbFact[] = [];
  for (const site of MeasurementSite.limbs) {
    if (!sites.has(site)) continue;
    const limb = siteChangeOf({ measurements, site, asOf, days: limbWindowDays });
    if (limb !== undefined) facts.push({ site, days: limbWindowDays, limb, waist });
  }
  return facts;
}
