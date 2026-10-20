import type { CalendarDate } from '../domain/CalendarDate';
import type { MenstruationDay } from '../domain/MenstruationDay';
import type { MenstruationRepository } from '../domain/repositories/MenstruationRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day } from './columns';

/** `MenstruationRepository` kept in the database: one row per flow day (MM-20). */
export class SqlMenstruationRepository implements MenstruationRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchFlowDays(): Watched<MenstruationDay[]> {
    return this.db.watch(['menstruation_days'], async (db) =>
      (await db.select('SELECT * FROM menstruation_days ORDER BY epoch_day')).map((r) => ({ date: day(r, 'epoch_day') })),
    );
  }

  markFlowDay(date: CalendarDate): Promise<void> {
    return this.db.write(['menstruation_days'], (db) =>
      db.execute('INSERT OR IGNORE INTO menstruation_days (epoch_day) VALUES (?)', [date.epochDay]),
    );
  }

  unmarkFlowDay(date: CalendarDate): Promise<void> {
    return this.db.write(['menstruation_days'], (db) =>
      db.execute('DELETE FROM menstruation_days WHERE epoch_day = ?', [date.epochDay]),
    );
  }
}
