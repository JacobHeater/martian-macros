import type { MmDbApi } from '../../src/sql/native/MmDbApi';
import { fromBridgeValue } from '../../src/sql/native/fromBridgeValue';
import { toBridgeValue } from '../../src/sql/native/toBridgeValue';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/**
 * The native SQLite plugin stood in for by the WebAssembly build, so the
 * native adapter's queueing, transactions and bridge encoding run against a
 * real SQLite without a phone.
 */
export function fakeMmDb(): MmDbApi {
  const open = new Map<number, WasmSqlDatabase>();
  let next = 1;
  const found = (db: number) => {
    const database = open.get(db);
    if (database === undefined) throw new Error(`No open database ${db}.`);
    return database;
  };
  return {
    open: async () => {
      const db = next;
      next += 1;
      open.set(db, await WasmSqlDatabase.open());
      return { db };
    },
    select: async ({ db, sql, params }) => ({
      rows: (await found(db).select(sql, params.map(fromBridgeValue))).map((row) =>
        Object.fromEntries(Object.entries(row).map(([column, value]) => [column, toBridgeValue(value)])),
      ),
    }),
    execute: ({ db, sql, params }) => found(db).execute(sql, params.map(fromBridgeValue)),
    executeScript: ({ db, sql }) => found(db).executeScript(sql),
    close: async ({ db }) => {
      await found(db).close();
      open.delete(db);
    },
  };
}
