import type { CalendarDate } from '../domain/CalendarDate';
import { DayCompleteness } from '../domain/DayCompleteness';
import { intakeDaysFrom } from '../domain/intakeDaysFrom';
import type { IntakeDay } from '../domain/IntakeDay';
import type { IntakeReader } from '../domain/repositories/IntakeReader';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { integer, named } from './columns';
import { foodFromRow } from './foodFromRow';

/** `IntakeReader` derived from the food log and the day marks in the database. */
export class SqlIntakeReader implements IntakeReader {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchIntakeDays({ since }: { since: CalendarDate }): Watched<IntakeDay[]> {
    return this.db.watch(['food_entries', 'day_marks'], async (db) => {
      const food = await db.select('SELECT * FROM food_entries WHERE epoch_day >= ? ORDER BY id', [since.epochDay]);
      const marks = await db.select('SELECT epoch_day, completeness FROM day_marks');
      return intakeDaysFrom(
        food.map(foodFromRow),
        new Map(marks.map((m) => [integer(m, 'epoch_day'), named(DayCompleteness.values, m, 'completeness')])),
      );
    });
  }
}
