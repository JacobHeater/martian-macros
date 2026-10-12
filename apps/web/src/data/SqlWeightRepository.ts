import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightRepository } from '../domain/repositories/WeightRepository';
import type { WeightObservation } from '../domain/WeightObservation';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, number, optionalText } from './columns';
import { upsert } from './statements';

/** `WeightRepository` kept in the database. */
export class SqlWeightRepository implements WeightRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchWeights(): Watched<WeightObservation[]> {
    return this.db.watch(['weight_entries'], async (db) =>
      (await db.select('SELECT * FROM weight_entries ORDER BY epoch_day')).map((r) => ({
        date: day(r, 'epoch_day'),
        weightKg: number(r, 'weight_kg'),
        deviceId: optionalText(r, 'device_id'),
      })),
    );
  }

  saveWeight(date: CalendarDate, weightKg: number): Promise<void> {
    // The device is not among the columns given, so an update keeps the
    // source of the reading it replaces.
    return this.db.write(['weight_entries'], (db) =>
      upsert(db, 'weight_entries', ['epoch_day'], { epoch_day: date.epochDay, weight_kg: weightKg }),
    );
  }

  deleteWeight(date: CalendarDate): Promise<void> {
    return this.db.write(['weight_entries'], (db) =>
      db.execute('DELETE FROM weight_entries WHERE epoch_day = ?', [date.epochDay]),
    );
  }
}
