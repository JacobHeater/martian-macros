import { StateError } from '../lang/StateError';
import type { Watched } from '../lang/Watched';
import type { SqlDatabase } from '../sql/SqlDatabase';
import { integer } from './columns';
import type { MigrationStep } from './MigrationStep';
import { migrationSteps } from './migrationSteps';
import { currentSchema, currentSchemaVersion, type Table } from './schema';
import { SchemaMigrationError } from './SchemaMigrationError';

interface Watcher {
  readonly tables: ReadonlySet<Table>;
  readonly read: () => void;
}

/**
 * The user's database, opened at this app's schema version, and the one
 * place that knows which tables a write touched, so that anything watching
 * them reads again.
 */
export class AppDatabase {
  private readonly sql: SqlDatabase;
  private readonly watchers = new Set<Watcher>();

  private constructor(sql: SqlDatabase) {
    this.sql = sql;
  }

  /**
   * Opens the database in `sql`. A new one is created at the current
   * schema; an older one is upgraded a version at a time, all steps or
   * none; one saved by a newer app is refused and left as it is. The
   * `version`, `schema` and `steps` are given only by tests.
   */
  static async open(
    sql: SqlDatabase,
    {
      version = currentSchemaVersion,
      schema = currentSchema,
      steps = migrationSteps,
    }: { version?: number; schema?: string; steps?: ReadonlyMap<number, MigrationStep> } = {},
  ): Promise<AppDatabase> {
    const found = (await sql.select('PRAGMA user_version'))[0];
    const from = found === undefined ? 0 : integer(found, 'user_version');
    if (from > version) throw SchemaMigrationError.newerData(from, version);
    if (from === 0) {
      await sql.transaction(async (inside) => {
        await inside.executeScript(schema);
        await inside.execute(`PRAGMA user_version = ${version}`);
      });
    } else if (from < version) {
      try {
        // All steps or none: a failure leaves the database at `from`.
        await sql.transaction(async (inside) => {
          for (let at = from; at < version; at++) {
            const step = steps.get(at);
            if (step === undefined) throw new StateError(`No migration from schema version ${at}.`);
            await step(inside);
          }
          await inside.execute(`PRAGMA user_version = ${version}`);
        });
      } catch (cause) {
        throw new SchemaMigrationError(from, version, cause);
      }
    }
    return new AppDatabase(sql);
  }

  /** Reads without watching. */
  read<T>(query: (db: SqlDatabase) => Promise<T>): Promise<T> {
    return query(this.sql);
  }

  /**
   * What `query` reads, now and again after every write to one of
   * `tables`. A query that fails is told to the subscriber's `onError`.
   */
  watch<T>(tables: readonly Table[], query: (db: SqlDatabase) => Promise<T>): Watched<T> {
    return {
      subscribe: (listener, onError) => {
        let stopped = false;
        const watcher: Watcher = {
          tables: new Set(tables),
          read: () => {
            query(this.sql).then(
              (value) => {
                if (!stopped) listener(value);
              },
              (error: unknown) => {
                if (!stopped) onError?.(error);
              },
            );
          },
        };
        this.watchers.add(watcher);
        watcher.read();
        return () => {
          stopped = true;
          this.watchers.delete(watcher);
        };
      },
    };
  }

  /**
   * Runs `work` as one transaction, then has everything watching one of
   * `tables` read again. Nothing is told when the work fails, because
   * nothing changed.
   */
  async write<T>(touched: readonly Table[], work: (db: SqlDatabase) => Promise<T>): Promise<T> {
    const result = await this.sql.transaction(work);
    for (const watcher of [...this.watchers]) {
      if (touched.some((table) => watcher.tables.has(table))) watcher.read();
    }
    return result;
  }

  close(): Promise<void> {
    this.watchers.clear();
    return this.sql.close();
  }
}
