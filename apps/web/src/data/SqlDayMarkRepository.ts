import type { CalendarDate } from '../domain/CalendarDate';
import { DayCompleteness } from '../domain/DayCompleteness';
import type { DayMarkRepository } from '../domain/repositories/DayMarkRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { named } from './columns';
import { upsert } from './statements';

/** `DayMarkRepository` kept in the database. */
export class SqlDayMarkRepository implements DayMarkRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchCompleteness(date: CalendarDate): Watched<DayCompleteness> {
    return this.db.watch(['day_marks'], async (db) => {
      const row = (await db.select('SELECT completeness FROM day_marks WHERE epoch_day = ?', [date.epochDay]))[0];
      return row === undefined ? 'unmarked' : named(DayCompleteness.values, row, 'completeness');
    });
  }

  setCompleteness(date: CalendarDate, completeness: DayCompleteness): Promise<void> {
    return this.db.write(['day_marks'], (db) =>
      upsert(db, 'day_marks', ['epoch_day'], { epoch_day: date.epochDay, completeness }),
    );
  }
}
