import { expect, it } from 'vitest';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import type { SqlDatabase } from '../../src/sql/SqlDatabase';
import type { SqlValue } from '../../src/sql/SqlValue';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/**
 * MM-699: on the owner's Pixel a move from the iPhone was still restoring after minutes, one INSERT per row across
 * the native bridge for every Apple Health sample, until the app was swiped away and the restore rolled back. A
 * restore writes its rows in batches: thousands of rows are tens of statements, each under SQLite's oldest limit of
 * 999 parameters (Android 8, the app's oldest).
 */
const samples = 5000;

/** A connection that counts every statement it runs, inside a transaction too, and the most parameters one had. */
function counting(db: SqlDatabase, seen: { statements: number; largest: number }): SqlDatabase {
  const count = (params?: readonly SqlValue[]) => {
    seen.statements += 1;
    seen.largest = Math.max(seen.largest, params?.length ?? 0);
  };
  return {
    select: (sql, params) => db.select(sql, params),
    execute: (sql, params) => {
      count(params);
      return db.execute(sql, params);
    },
    executeScript: (sql) => db.executeScript(sql),
    transaction: (work) => db.transaction((inside) => work(counting(inside, seen))),
    close: () => db.close(),
  };
}

it('restores thousands of rows in tens of statements, each within 999 parameters', async () => {
  const from = await WasmSqlDatabase.open();
  await SqlRepositories.open(from);
  await from.transaction(async (db) => {
    for (let i = 0; i < samples; i++) {
      await db.execute(
        'INSERT INTO imported_samples (type, platform_id, value, start_ms, end_ms, source_id, source_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['heartRate', `sample-${i}`, 60 + (i % 40), 1_700_000_000_000 + i * 60_000, null, 'com.apple.health', 'Apple Watch'],
      );
    }
  });
  const snapshot = await from.exportBytes();

  const seen = { statements: 0, largest: 0 };
  const to = await WasmSqlDatabase.open();
  const repos = await SqlRepositories.open(counting(to, seen));
  seen.statements = 0;
  seen.largest = 0;
  await repos.restorer.restoreFrom(snapshot);

  expect((await to.select('SELECT COUNT(*) AS n FROM imported_samples'))[0]?.['n']).toBe(samples);
  expect(seen.statements).toBeLessThan(200);
  expect(seen.largest).toBeLessThanOrEqual(999);
});
