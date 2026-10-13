import type { CalendarDate } from '../domain/CalendarDate';
import type { WaistRepository } from '../domain/repositories/WaistRepository';
import { WaistObservation } from '../domain/WaistObservation';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, number, optionalNumber, orNull } from './columns';
import { upsert } from './upsert';

/** `WaistRepository` kept in the database. */
export class SqlWaistRepository implements WaistRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchWaist(): Watched<WaistObservation[]> {
    return this.db.watch(['waist_entries'], async (db) =>
      (await db.select('SELECT * FROM waist_entries ORDER BY epoch_day')).map(
        (r) =>
          new WaistObservation({
            date: day(r, 'epoch_day'),
            waistCm: number(r, 'waist_cm'),
            readings: ['reading1_cm', 'reading2_cm', 'reading3_cm']
              .map((column) => optionalNumber(r, column))
              .filter((reading) => reading !== undefined),
          }),
      ),
    );
  }

  saveWaist(
    date: CalendarDate,
    waistCm: number,
    { readings = [] }: { readings?: readonly number[] } = {},
  ): Promise<void> {
    return this.db.write(['waist_entries'], (db) =>
      upsert(db, 'waist_entries', ['epoch_day'], {
        epoch_day: date.epochDay,
        waist_cm: waistCm,
        reading1_cm: orNull(readings[0]),
        reading2_cm: orNull(readings[1]),
        reading3_cm: orNull(readings[2]),
      }),
    );
  }
}
