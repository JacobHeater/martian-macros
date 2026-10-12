import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { SqlDatabase } from '../SqlDatabase';
import { SqlFailure } from '../SqlFailure';
import type { SqlRow } from '../SqlRow';
import type { SqlValue } from '../SqlValue';

let loading: Promise<Sqlite3Static> | undefined;

/** Loads the WebAssembly module once, however many databases are opened. */
function load(): Promise<Sqlite3Static> {
  loading ??= sqlite3InitModule();
  return loading;
}

function failure(error: unknown): SqlFailure {
  return new SqlFailure(error instanceof Error ? error.message : String(error));
}

/**
 * `SqlDatabase` on the official SQLite WebAssembly build (MM-231), for tests
 * and for the app in a browser. It is held in memory and written nowhere:
 * nothing reaches browser storage, and closing it or reloading the page
 * loses it. The phone uses a native database instead.
 */
export class WasmSqlDatabase implements SqlDatabase {
  private readonly sqlite3: Sqlite3Static;
  private db: Database | undefined;

  /** The last call queued; the next one waits for it. */
  private last: Promise<unknown> = Promise.resolve();

  private constructor(sqlite3: Sqlite3Static, db: Database) {
    this.sqlite3 = sqlite3;
    this.db = db;
  }

  /**
   * Opens an empty database, or, with `bytes`, a copy of a database file
   * (a food pack, say) held in memory.
   */
  static async open({ bytes }: { bytes?: Uint8Array | undefined } = {}): Promise<WasmSqlDatabase> {
    const sqlite3 = await load();
    try {
      const db = new sqlite3.oo1.DB(':memory:');
      if (bytes !== undefined) {
        const { capi, wasm } = sqlite3;
        const copy = wasm.allocFromTypedArray(bytes);
        const result = capi.sqlite3_deserialize(
          db,
          'main',
          copy,
          bytes.byteLength,
          bytes.byteLength,
          capi.SQLITE_DESERIALIZE_FREEONCLOSE | capi.SQLITE_DESERIALIZE_RESIZEABLE,
        );
        db.checkRc(result);
        // A file that is not a database is only found out when it is read.
        db.exec('SELECT count(*) FROM sqlite_schema');
      }
      return new WasmSqlDatabase(sqlite3, db);
    } catch (error) {
      throw failure(error);
    }
  }

  /** Runs `step` after every call made before it has finished. */
  private queued<T>(step: (db: Database) => T | Promise<T>): Promise<T> {
    const run = async () => {
      if (this.db === undefined) throw new SqlFailure('The database is closed.');
      return step(this.db);
    };
    const result = this.last.then(run, run);
    this.last = result.catch(() => undefined);
    return result;
  }

  /** Runs `step` against SQLite, turning whatever it throws into a `SqlFailure`. */
  private static asked<T>(step: () => T): T {
    try {
      return step();
    } catch (error) {
      throw error instanceof SqlFailure ? error : failure(error);
    }
  }

  private static selectFrom(db: Database, sql: string, params: readonly SqlValue[]): SqlRow[] {
    const rows = WasmSqlDatabase.asked(() =>
      db.exec({ sql, bind: [...params], rowMode: 'object', returnValue: 'resultRows' }),
    );
    return rows.map((row) => {
      const plain: Record<string, SqlValue> = {};
      for (const [column, value] of Object.entries(row)) {
        if (typeof value === 'bigint') {
          throw new SqlFailure(`Column ${column} holds a whole number too large to use: ${value}`);
        }
        plain[column] = value instanceof ArrayBuffer || value instanceof Int8Array ? new Uint8Array(value) : value;
      }
      return plain;
    });
  }

  private static executeOn(db: Database, sql: string, params: readonly SqlValue[]): void {
    WasmSqlDatabase.asked(() => db.exec({ sql, bind: [...params] }));
  }

  private static scriptOn(db: Database, sql: string): void {
    WasmSqlDatabase.asked(() => db.exec(sql));
  }

  select(sql: string, params: readonly SqlValue[] = []): Promise<SqlRow[]> {
    return this.queued((db) => WasmSqlDatabase.selectFrom(db, sql, params));
  }

  execute(sql: string, params: readonly SqlValue[] = []): Promise<void> {
    return this.queued((db) => WasmSqlDatabase.executeOn(db, sql, params));
  }

  executeScript(sql: string): Promise<void> {
    return this.queued((db) => WasmSqlDatabase.scriptOn(db, sql));
  }

  transaction<T>(work: (inside: SqlDatabase) => Promise<T>): Promise<T> {
    return this.queued(async (db) => {
      // What `work` is handed goes straight to the database: the queue is
      // held by the transaction itself until it ends.
      let open = true;
      const check = () => {
        if (!open) throw new SqlFailure('The transaction has ended.');
      };
      const inside: SqlDatabase = {
        select: async (sql, params = []) => {
          check();
          return WasmSqlDatabase.selectFrom(db, sql, params);
        },
        execute: async (sql, params = []) => {
          check();
          WasmSqlDatabase.executeOn(db, sql, params);
        },
        executeScript: async (sql) => {
          check();
          WasmSqlDatabase.scriptOn(db, sql);
        },
        transaction: (nested) => nested(inside),
        close: async () => {
          throw new SqlFailure('A database is not closed from inside a transaction.');
        },
      };
      WasmSqlDatabase.scriptOn(db, 'BEGIN');
      try {
        const result = await work(inside);
        WasmSqlDatabase.scriptOn(db, 'COMMIT');
        return result;
      } catch (error) {
        // What the work threw is thrown on as it is, not as a SqlFailure.
        WasmSqlDatabase.scriptOn(db, 'ROLLBACK');
        throw error;
      } finally {
        open = false;
      }
    });
  }

  /** The database as the bytes of a database file, as a pack is written. */
  exportBytes(): Promise<Uint8Array> {
    return this.queued((db) => WasmSqlDatabase.asked(() => this.sqlite3.capi.sqlite3_js_db_export(db)));
  }

  close(): Promise<void> {
    return this.queued((db) => {
      WasmSqlDatabase.asked(() => db.close());
      this.db = undefined;
    });
  }
}
