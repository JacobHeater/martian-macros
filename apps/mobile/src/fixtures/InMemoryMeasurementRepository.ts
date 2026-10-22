import type { CalendarDate } from '../domain/CalendarDate';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import { SiteObservation } from '../domain/measurements/SiteObservation';
import type { MeasurementRepository } from '../domain/repositories/MeasurementRepository';
import { ArgumentError } from '../lang/ArgumentError';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** Oldest first; on one day, in the sites' fixed order. */
const byDayThenSite = (a: SiteObservation, b: SiteObservation) =>
  a.date.compareTo(b.date) || MeasurementSite.values.indexOf(a.site) - MeasurementSite.values.indexOf(b.site);

/**
 * `MeasurementRepository` held in memory (MM-156). Like the table, it
 * refuses a value outside 10 to 300 cm, which no site can have.
 */
export class InMemoryMeasurementRepository implements MeasurementRepository {
  private readonly entries = new ObservableValue<ReadonlyMap<string, SiteObservation>>(new Map());

  watchSite(site: MeasurementSite): Watched<SiteObservation[]> {
    return this.entries.watchAs((all) => [...all.values()].filter((o) => o.site === site).sort(byDayThenSite));
  }

  watchMeasurements(): Watched<SiteObservation[]> {
    return this.entries.watchAs((all) => [...all.values()].sort(byDayThenSite));
  }

  async saveMeasurement(
    site: MeasurementSite,
    date: CalendarDate,
    valueCm: number,
    { readings = [] }: { readings?: readonly number[] } = {},
  ): Promise<void> {
    if (!(valueCm >= 10 && valueCm <= 300)) throw new ArgumentError(`Not a measurement: ${valueCm} cm.`);
    this.entries.value = new Map(this.entries.value).set(
      `${site}/${date.epochDay}`,
      new SiteObservation({ site, date, valueCm, readings: Object.freeze([...readings]) }),
    );
  }

  clear(): void {
    this.entries.value = new Map();
  }
}
