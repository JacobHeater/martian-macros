import type { CalendarDate } from '../domain/CalendarDate';
import type { CoachAdviceGiven } from '../engine/analysis/accountability/CoachAdviceGiven';
import { CoachAdviceGivenKind } from '../engine/analysis/accountability/CoachAdviceGivenKind';
import type { CoachAdviceRecordRepository } from '../engine/analysis/accountability/CoachAdviceRecordRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, named, number, optionalText, orNull, text } from './columns';

/**
 * `CoachAdviceRecordRepository` kept in the database (MM-617): a row of
 * `coach_advice_given` for each food key, kind and day, the first recorded
 * kept.
 */
export class SqlCoachAdviceRecordRepository implements CoachAdviceRecordRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchAdviceGivenSince(since: CalendarDate): Watched<CoachAdviceGiven[]> {
    return this.db.watch(['coach_advice_given'], async (db) =>
      (
        await db.select('SELECT * FROM coach_advice_given WHERE given_epoch_day >= ? ORDER BY given_epoch_day, rowid', [since.epochDay])
      ).map((r) => ({
        foodKey: text(r, 'food_key'),
        foodName: text(r, 'food_name'),
        kind: named(CoachAdviceGivenKind.values, r, 'kind'),
        replacementName: optionalText(r, 'replacement_name'),
        kcal: number(r, 'kcal'),
        on: day(r, 'given_epoch_day'),
      })),
    );
  }

  async recordAdviceGiven(entries: readonly CoachAdviceGiven[]): Promise<void> {
    if (entries.length === 0) return;
    await this.db.write(['coach_advice_given'], async (db) => {
      for (const g of entries) {
        await db.execute(
          'INSERT OR IGNORE INTO coach_advice_given (food_key, kind, given_epoch_day, food_name, replacement_name, kcal) VALUES (?, ?, ?, ?, ?, ?)',
          [g.foodKey, g.kind, g.on.epochDay, g.foodName, orNull(g.replacementName), g.kcal],
        );
      }
    });
  }
}
