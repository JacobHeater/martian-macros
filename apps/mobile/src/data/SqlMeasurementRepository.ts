import type { CalendarDate } from '../domain/CalendarDate';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import { SiteObservation } from '../domain/measurements/SiteObservation';
import type { MeasurementRepository } from '../domain/repositories/MeasurementRepository';
import type { Watched } from '../lang/Watched';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { day, named, number, optionalNumber, orNull } from './columns';
import { upsert } from './upsert';

const observationOf = (r: SqlRow) =>
  new SiteObservation({
    site: named(MeasurementSite.values, r, 'site'),
    date: day(r, 'epoch_day'),
    valueCm: number(r, 'value_cm'),
    readings: ['reading1_cm', 'reading2_cm', 'reading3_cm']
      .map((column) => optionalNumber(r, column))
      .filter((reading) => reading !== undefined),
  });

/** The sites in their fixed order, for SQL: waist first, as the session takes them. */
const siteOrder = `CASE site ${MeasurementSite.values.map((site, i) => `WHEN '${site}' THEN ${i}`).join(' ')} END`;

/**
 * `MeasurementRepository` kept in the database (MM-156): one row per site
 * and day in `body_measurements`, the waist's among them.
 */
export class SqlMeasurementRepository implements MeasurementRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchSite(site: MeasurementSite): Watched<SiteObservation[]> {
    return this.db.watch(['body_measurements'], async (db) =>
      (await db.select('SELECT * FROM body_measurements WHERE site = ? ORDER BY epoch_day', [site])).map(observationOf),
    );
  }

  watchMeasurements(): Watched<SiteObservation[]> {
    return this.db.watch(['body_measurements'], async (db) =>
      (await db.select(`SELECT * FROM body_measurements ORDER BY epoch_day, ${siteOrder}`)).map(observationOf),
    );
  }

  saveMeasurement(
    site: MeasurementSite,
    date: CalendarDate,
    valueCm: number,
    { readings = [] }: { readings?: readonly number[] } = {},
  ): Promise<void> {
    return this.db.write(['body_measurements'], (db) =>
      upsert(db, 'body_measurements', ['site', 'epoch_day'], {
        site,
        epoch_day: date.epochDay,
        value_cm: valueCm,
        reading1_cm: orNull(readings[0]),
        reading2_cm: orNull(readings[1]),
        reading3_cm: orNull(readings[2]),
      }),
    );
  }
}
