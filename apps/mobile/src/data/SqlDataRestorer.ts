import type { BackupContents } from '../domain/backup/BackupContents';
import type { DataRestorer } from '../domain/repositories/DataRestorer';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlRow } from '../sql/SqlRow';
import type { SqlValue } from '../sql/SqlValue';
import { AppDatabase } from './AppDatabase';
import { describeDatabase } from './describeDatabase';
import { tables } from './tables';

/**
 * Restores by copying every table's rows from a copy of the backup into
 * this database in one write (MM-63), so the live connection stays and
 * every store re-reads. `openSnapshot` gives a writable connection to a
 * copy of the bytes (in memory, or a temporary file on the phone); the copy
 * is opened through `AppDatabase.open` first, which brings an older schema
 * up to the current one (MM-61), and is closed after.
 */
export class SqlDataRestorer implements DataRestorer {
  private readonly db: AppDatabase;
  private readonly openSnapshot: (bytes: Uint8Array) => Promise<SqlDatabase>;

  constructor(db: AppDatabase, openSnapshot: (bytes: Uint8Array) => Promise<SqlDatabase>) {
    this.db = db;
    this.openSnapshot = openSnapshot;
  }

  private async withCopy<T>(snapshot: Uint8Array, work: (copy: SqlDatabase) => Promise<T>): Promise<T> {
    const copy = await this.openSnapshot(snapshot);
    try {
      await AppDatabase.open(copy);
      return await work(copy);
    } finally {
      await copy.close();
    }
  }

  describe(snapshot: Uint8Array): Promise<BackupContents> {
    return this.withCopy(snapshot, (copy) => describeDatabase(copy));
  }

  describeHere(): Promise<BackupContents> {
    return this.db.read((db) => describeDatabase(db));
  }

  restoreFrom(snapshot: Uint8Array): Promise<void> {
    return this.withCopy(snapshot, async (copy) => {
      const copied = new Map<string, SqlRow[]>();
      for (const table of tables) copied.set(table, await copy.select(`SELECT * FROM ${table}`));
      await this.db.write(tables, async (db) => {
        for (const table of tables) await db.execute(`DELETE FROM ${table}`);
        for (const table of tables) {
          for (const row of copied.get(table) ?? []) {
            const columns = Object.keys(row);
            await db.execute(
              `INSERT INTO ${table} (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
              columns.map((c) => row[c] as SqlValue),
            );
          }
        }
      });
    });
  }
}
