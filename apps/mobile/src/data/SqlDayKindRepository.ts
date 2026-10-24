import type { CalendarDate } from '../domain/CalendarDate';
import { DayKind } from '../domain/DayKind';
import type { DayKindRepository } from '../domain/repositories/DayKindRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { integer, named } from './columns';
import { upsert } from './upsert';

/**
 * `DayKindRepository` kept in the database (MM-611): a row for each day
 * marked a Refeed or a Day off; a day with no mark has no row.
 */
export class SqlDayKindRepository implements DayKindRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchDayKind(date: CalendarDate): Watched<DayKind> {
    return this.db.watch(['day_kinds'], async (db) => {
      const row = (await db.select('SELECT kind FROM day_kinds WHERE epoch_day = ?', [date.epochDay]))[0];
      return row === undefined ? 'none' : named(DayKind.values, row, 'kind');
    });
  }

  watchMarkedDays(): Watched<ReadonlyMap<number, DayKind>> {
    return this.db.watch(['day_kinds'], async (db) => {
      const rows = await db.select('SELECT epoch_day, kind FROM day_kinds ORDER BY epoch_day');
      return new Map(rows.map((row) => [integer(row, 'epoch_day'), named(DayKind.values, row, 'kind')]));
    });
  }

  setDayKind(date: CalendarDate, kind: DayKind): Promise<void> {
    return this.db.write(['day_kinds'], async (db) => {
      if (kind === 'none') {
        await db.execute('DELETE FROM day_kinds WHERE epoch_day = ?', [date.epochDay]);
      } else {
        await upsert(db, 'day_kinds', ['epoch_day'], { epoch_day: date.epochDay, kind });
      }
    });
  }
}
