import type { SqlDatabase } from '../SqlDatabase';
import { SqlFailure } from '../SqlFailure';
import type { SqlRow } from '../SqlRow';
import type { SqlValue } from '../SqlValue';
import type { BridgeSqlValue } from './BridgeSqlValue';
import { fromBridgeValue } from './fromBridgeValue';
import type { MmDbApi } from './MmDbApi';
import { toBridgeValue } from './toBridgeValue';

const failure = (error: unknown) =>
  error instanceof SqlFailure ? error : new SqlFailure(error instanceof Error ? error.message : String(error));

const decoded = (row: Record<string, BridgeSqlValue>): SqlRow =>
  Object.fromEntries(Object.entries(row).map(([column, value]) => [column, fromBridgeValue(value)]));

/**
 * `SqlDatabase` over the native SQLite plugin (MM-231): the phone's own
 * storage, which outlives the app. The plugin runs each database's calls
 * in order on one connection, and this adapter queues them besides, so a
 * transaction keeps every other call waiting as the contract asks.
 */
export class NativeSqlDatabase implements SqlDatabase {
  private readonly api: MmDbApi;
  private handle: number | undefined;

  /** The last call queued; the next one waits for it. */
  private last: Promise<unknown> = Promise.resolve();

  private constructor(api: MmDbApi, handle: number) {
    this.api = api;
    this.handle = handle;
  }

  /** Opens the app's database `name`, or the file at `path`, over `api`. */
  static async open(options: { name?: string; path?: string; readOnly?: boolean }, api: MmDbApi): Promise<NativeSqlDatabase> {
    try {
      const { db } = await api.open(options);
      return new NativeSqlDatabase(api, db);
    } catch (error) {
      throw failure(error);
    }
  }

  /** Runs `step` after every call made before it has finished. */
  private queued<T>(step: (db: number) => Promise<T>): Promise<T> {
    const run = async () => {
      if (this.handle === undefined) throw new SqlFailure('The database is closed.');
      return step(this.handle);
    };
    const result = this.last.then(run, run);
    this.last = result.catch(() => undefined);
    return result;
  }

  /** What `step` gives, with whatever the plugin threw turned into a `SqlFailure`. */
  private static async asked<T>(step: () => Promise<T>): Promise<T> {
    try {
      return await step();
    } catch (error) {
      throw failure(error);
    }
  }

  private async selectOn(db: number, sql: string, params: readonly SqlValue[]): Promise<SqlRow[]> {
    const { rows } = await this.api.select({ db, sql, params: params.map(toBridgeValue) });
    return rows.map(decoded);
  }

  select(sql: string, params: readonly SqlValue[] = []): Promise<SqlRow[]> {
    return this.queued((db) => NativeSqlDatabase.asked(() => this.selectOn(db, sql, params)));
  }

  execute(sql: string, params: readonly SqlValue[] = []): Promise<void> {
    return this.queued(async (db) => {
      await NativeSqlDatabase.asked(() => this.api.execute({ db, sql, params: params.map(toBridgeValue) }));
    });
  }

  executeScript(sql: string): Promise<void> {
    return this.queued(async (db) => {
      await NativeSqlDatabase.asked(() => this.api.executeScript({ db, sql }));
    });
  }

  transaction<T>(work: (inside: SqlDatabase) => Promise<T>): Promise<T> {
    return this.queued(async (db) => {
      // What `work` is handed goes straight to the plugin: the queue is
      // held by the transaction itself until it ends.
      let open = true;
      const check = () => {
        if (!open) throw new SqlFailure('The transaction has ended.');
      };
      const inside: SqlDatabase = {
        select: async (sql, params = []) => {
          check();
          return NativeSqlDatabase.asked(() => this.selectOn(db, sql, params));
        },
        execute: async (sql, params = []) => {
          check();
          await NativeSqlDatabase.asked(() => this.api.execute({ db, sql, params: params.map(toBridgeValue) }));
        },
        executeScript: async (sql) => {
          check();
          await NativeSqlDatabase.asked(() => this.api.executeScript({ db, sql }));
        },
        transaction: (nested) => nested(inside),
        close: async () => {
          throw new SqlFailure('A database is not closed from inside a transaction.');
        },
      };
      await NativeSqlDatabase.asked(() => this.api.execute({ db, sql: 'BEGIN', params: [] }));
      try {
        const result = await work(inside);
        await NativeSqlDatabase.asked(() => this.api.execute({ db, sql: 'COMMIT', params: [] }));
        return result;
      } catch (error) {
        // What the work threw is thrown on as it is, not as a SqlFailure.
        await NativeSqlDatabase.asked(() => this.api.execute({ db, sql: 'ROLLBACK', params: [] })).catch(() => undefined);
        throw error;
      } finally {
        open = false;
      }
    });
  }

  close(): Promise<void> {
    return this.queued(async (db) => {
      await NativeSqlDatabase.asked(() => this.api.close({ db }));
      this.handle = undefined;
    });
  }
}
