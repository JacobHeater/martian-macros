import type { DailyStepsRepository } from '../domain/repositories/DailyStepsRepository';
import type { StepsDay } from '../domain/training/StepsDay';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, integer } from './columns';
import { upsert } from './upsert';

/**
 * `DailyStepsRepository` kept in the database (MM-677): a row for each day
 * the platform gave a total for, replaced when the total changes.
 */
export class SqlDailyStepsRepository implements DailyStepsRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchDailySteps(): Watched<StepsDay[]> {
    return this.db.watch(['daily_steps'], async (db) => {
      const rows = await db.select('SELECT epoch_day, steps FROM daily_steps ORDER BY epoch_day');
      return rows.map((row) => ({ date: day(row, 'epoch_day'), steps: integer(row, 'steps') }));
    });
  }

  saveDailySteps(days: readonly StepsDay[]): Promise<void> {
    const kept = days.filter((entry) => Number.isInteger(entry.steps) && entry.steps > 0);
    if (kept.length === 0) return Promise.resolve();
    return this.db.write(['daily_steps'], async (db) => {
      for (const entry of kept) {
        await upsert(db, 'daily_steps', ['epoch_day'], { epoch_day: entry.date.epochDay, steps: entry.steps });
      }
    });
  }
}
