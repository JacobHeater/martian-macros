import type { SleepRepository } from '../domain/repositories/SleepRepository';
import { SleepNight } from '../domain/SleepNight';
import { SleepSource } from '../domain/SleepSource';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, named, number, optionalText, orNull } from './columns';
import { upsert } from './upsert';

/** `SleepRepository` kept in the database: one row per night (MM-250). */
export class SqlSleepRepository implements SleepRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchSleepNights(): Watched<SleepNight[]> {
    return this.db.watch(['sleep_nights'], async (db) =>
      (await db.select('SELECT * FROM sleep_nights ORDER BY epoch_day')).map(
        (r) =>
          new SleepNight({
            date: day(r, 'epoch_day'),
            minutesAsleep: number(r, 'minutes_asleep'),
            source: named(SleepSource.values, r, 'source'),
            sourceName: optionalText(r, 'source_name'),
          }),
      ),
    );
  }

  saveSleepNight(night: SleepNight): Promise<void> {
    return this.db.write(['sleep_nights'], (db) =>
      upsert(db, 'sleep_nights', ['epoch_day'], {
        epoch_day: night.date.epochDay,
        minutes_asleep: night.minutesAsleep,
        source: night.source,
        source_name: orNull(night.sourceName),
      }),
    );
  }
}
