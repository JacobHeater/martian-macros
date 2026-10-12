import type { SqlRow } from './SqlRow';
import type { SqlValue } from './SqlValue';

/**
 * An open SQLite database (MM-231). The only thing the app's code knows
 * about SQLite: the WebAssembly build is behind it in tests and in a
 * browser, a native plugin on the phone, and one contract suite
 * (`sqlDatabaseContract`) holds each to the same behavior.
 *
 * Every call is asynchronous, because a call to a native plugin is. Calls
 * are carried out one at a time in the order they were made, and a
 * transaction keeps every other call waiting until it has ended, so one
 * caller's statements can never land inside another's transaction.
 */
export interface SqlDatabase {
  /** The rows `sql` gives, with `?` in it filled from `params` in order. */
  select(sql: string, params?: readonly SqlValue[]): Promise<SqlRow[]>;

  /** Runs one statement that gives no rows, with `?` filled from `params`. */
  execute(sql: string, params?: readonly SqlValue[]): Promise<void>;

  /** Runs several statements separated by semicolons, as a schema is. */
  executeScript(sql: string): Promise<void>;

  /**
   * Runs `work` as one transaction: everything it does through the database
   * it is handed is kept if it finishes and undone if it throws, and what it
   * threw is thrown on. Use only the database handed to `work` inside it.
   */
  transaction<T>(work: (inside: SqlDatabase) => Promise<T>): Promise<T>;

  /** Closes the database. Using it afterwards is an error. */
  close(): Promise<void>;
}
