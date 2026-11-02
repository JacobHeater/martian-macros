import { expect, it } from 'vitest';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import type { HealthSample } from '../../src/healthIngest';
import type { SqlDatabase } from '../../src/sql/SqlDatabase';
import type { SqlValue } from '../../src/sql/SqlValue';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/**
 * MM-721: on the owner's Pixel, the first read of Health Connect after the iPhone's records moved in (MM-698) re-read every
 * kind and wrote 108,000 samples one `INSERT` per row, each a call across the native bridge, for twenty minutes (seen in
 * logcat, 2026-11-02). An app swiped away in that time keeps no token for the kind and starts the kind over. The store
 * writes samples in multi-row statements, each within 999 parameters (SQLite's limit before 3.32; Android 8 has it).
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

const steps = (i: number, value = i): HealthSample => ({
  platformId: `s-${i}`,
  type: 'steps',
  value,
  start: new Date(1_700_000_000_000 + i * 60_000),
  end: new Date(1_700_000_000_000 + i * 60_000 + 30_000),
  sourceId: 'com.healthsynchronizer',
  sourceName: 'Health Synchronizer',
});

it('writes thousands of samples in tens of statements, each within 999 parameters', async () => {
  const seen = { statements: 0, largest: 0 };
  const db = await WasmSqlDatabase.open();
  const repos = await SqlRepositories.open(counting(db, seen));
  seen.statements = 0;
  seen.largest = 0;
  await repos.healthSamples.upsert(Array.from({ length: samples }, (_, i) => steps(i)));

  expect((await db.select('SELECT COUNT(*) AS n FROM imported_samples'))[0]?.['n']).toBe(samples);
  expect(seen.statements).toBeLessThan(100);
  expect(seen.largest).toBeLessThanOrEqual(999);
});

it('a sample written again in a batch replaces the one there, and the rest stay', async () => {
  const db = await WasmSqlDatabase.open();
  const repos = await SqlRepositories.open(db);
  await repos.healthSamples.upsert(Array.from({ length: 300 }, (_, i) => steps(i)));
  await repos.healthSamples.upsert([steps(7, 70), steps(299, 2990), steps(300)]);

  const kept = await repos.healthSamples.samples('steps');
  expect(kept).toHaveLength(301);
  expect(kept.find((s) => s.platformId === 's-7')?.value).toBe(70);
  expect(kept.find((s) => s.platformId === 's-299')?.value).toBe(2990);
  expect(kept.find((s) => s.platformId === 's-8')?.value).toBe(8);
});

it('a replace after an expired token writes the whole kind in batches too', async () => {
  const seen = { statements: 0, largest: 0 };
  const db = await WasmSqlDatabase.open();
  const repos = await SqlRepositories.open(counting(db, seen));
  await repos.healthSamples.upsert(Array.from({ length: 10 }, (_, i) => steps(i)));
  seen.statements = 0;
  seen.largest = 0;
  await repos.healthSamples.replace('steps', Array.from({ length: samples }, (_, i) => steps(i + 5)));

  expect((await db.select('SELECT COUNT(*) AS n FROM imported_samples'))[0]?.['n']).toBe(samples);
  expect(seen.statements).toBeLessThan(100);
  expect(seen.largest).toBeLessThanOrEqual(999);
});
