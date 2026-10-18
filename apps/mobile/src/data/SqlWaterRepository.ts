import type { CalendarDate } from '../domain/CalendarDate';
import type { WaterRepository } from '../domain/repositories/WaterRepository';
import { WaterEntry } from '../domain/water/WaterEntry';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, integer, moment, number } from './columns';
import { insert } from './insert';
import { update } from './update';

/** `WaterRepository` kept in the database (MM-313). Ids are never reused. */
export class SqlWaterRepository implements WaterRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchWater(date: CalendarDate): Watched<WaterEntry[]> {
    return this.db.watch(['water_entries'], async (db) =>
      (await db.select('SELECT * FROM water_entries WHERE epoch_day = ? ORDER BY at_ms, id', [date.epochDay])).map(
        (r) =>
          new WaterEntry({
            id: integer(r, 'id'),
            date: day(r, 'epoch_day'),
            ml: number(r, 'ml'),
            at: moment(r, 'at_ms'),
          }),
      ),
    );
  }

  watchWaterSince(since: CalendarDate): Watched<WaterEntry[]> {
    return this.db.watch(['water_entries'], async (db) =>
      (await db.select('SELECT * FROM water_entries WHERE epoch_day >= ? ORDER BY epoch_day, at_ms, id', [since.epochDay])).map(
        (r) =>
          new WaterEntry({
            id: integer(r, 'id'),
            date: day(r, 'epoch_day'),
            ml: number(r, 'ml'),
            at: moment(r, 'at_ms'),
          }),
      ),
    );
  }

  addWater(entry: WaterEntry): Promise<number> {
    return this.db.write(['water_entries'], (db) =>
      insert(db, 'water_entries', { epoch_day: entry.date.epochDay, ml: entry.ml, at_ms: entry.at.getTime() }),
    );
  }

  updateWater(entry: WaterEntry): Promise<void> {
    return this.db.write(['water_entries'], (db) =>
      update(
        db,
        'water_entries',
        { epoch_day: entry.date.epochDay, ml: entry.ml, at_ms: entry.at.getTime() },
        { column: 'id', value: entry.id },
      ),
    );
  }

  removeWater(id: number): Promise<void> {
    return this.db.write(['water_entries'], (db) => db.execute('DELETE FROM water_entries WHERE id = ?', [id]));
  }
}
