import type { WeightEventRepository } from '../domain/repositories/WeightEventRepository';
import type { WeightEvent } from '../domain/WeightEvent';
import { WeightEventType } from '../domain/WeightEventType';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, named } from './columns';
import { upsert } from './upsert';

/** `WeightEventRepository` kept in the database. */
export class SqlWeightEventRepository implements WeightEventRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchWeightEvents(): Watched<WeightEvent[]> {
    return this.db.watch(['weight_events'], async (db) => {
      const events: WeightEvent[] = (await db.select('SELECT * FROM weight_events ORDER BY date_epoch_day')).map(
        (r) => ({ date: day(r, 'date_epoch_day'), type: named(WeightEventType.values, r, 'type') }),
      );
      // Within a day, in the order the kinds are declared, which is not the order of their names.
      return events.sort((a, b) => {
        const byDate = a.date.compareTo(b.date);
        return byDate !== 0 ? byDate : WeightEventType.values.indexOf(a.type) - WeightEventType.values.indexOf(b.type);
      });
    });
  }

  saveWeightEvent(event: WeightEvent): Promise<void> {
    return this.db.write(['weight_events'], (db) =>
      upsert(db, 'weight_events', ['date_epoch_day', 'type'], {
        date_epoch_day: event.date.epochDay,
        type: event.type,
      }),
    );
  }

  deleteWeightEvent(event: WeightEvent): Promise<void> {
    return this.db.write(['weight_events'], (db) =>
      db.execute('DELETE FROM weight_events WHERE date_epoch_day = ? AND type = ?', [event.date.epochDay, event.type]),
    );
  }
}
