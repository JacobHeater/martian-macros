import type { DataEraser } from '../domain/repositories/DataEraser';
import type { AppDatabase } from './AppDatabase';
import { tables } from './tables';

/**
 * `DataEraser` for the database: empties every table, all or none. The ids
 * SQLite has handed out are kept, so none is reused afterwards. The file
 * is then vacuumed, so what was erased is not left in its freed pages
 * (MM-62).
 */
export class SqlDataEraser implements DataEraser {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  async eraseAll(): Promise<void> {
    await this.db.write(tables, async (db) => {
      for (const table of tables) await db.execute(`DELETE FROM ${table}`);
    });
    await this.db.vacuum();
  }
}
