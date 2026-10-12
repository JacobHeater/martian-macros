import { expect, it } from 'vitest';
import { AppDatabase } from '../../src/data/AppDatabase';
import { SqlFailure } from '../../src/sql/SqlFailure';
import { openSql } from './support/openRepositories';

/** MM-231: what is watching a table reads again after a write to it, and only then. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 5));

const countWeights = async (db: { select(sql: string): Promise<Readonly<Record<string, unknown>>[]> }) =>
  (await db.select('SELECT count(*) AS n FROM weight_entries'))[0]?.['n'];

const addWeight = (epochDay: number) => (db: { execute(sql: string, params: number[]): Promise<void> }) =>
  db.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (?, 80)', [epochDay]);

it('a write to a watched table is read again; a write to another table is not', async () => {
  const db = await AppDatabase.open(await openSql());
  const seen: unknown[] = [];
  const stop = db.watch(['weight_entries'], countWeights).subscribe((n) => seen.push(n));
  await settled();
  expect(seen).toEqual([0]);

  await db.write(['weight_entries'], addWeight(1));
  await settled();
  expect(seen).toEqual([0, 1]);

  await db.write(['day_marks'], (inside) =>
    inside.execute("INSERT INTO day_marks (epoch_day, completeness) VALUES (1, 'complete')"),
  );
  await settled();
  expect(seen).toEqual([0, 1]);
  stop();
});

it('nothing is told after unsubscribing', async () => {
  const db = await AppDatabase.open(await openSql());
  const seen: unknown[] = [];
  const stop = db.watch(['weight_entries'], countWeights).subscribe((n) => seen.push(n));
  await settled();
  stop();
  await db.write(['weight_entries'], addWeight(1));
  await settled();
  expect(seen).toEqual([0]);
});

it('a write that fails changes nothing and tells nothing', async () => {
  const db = await AppDatabase.open(await openSql());
  const seen: unknown[] = [];
  const stop = db.watch(['weight_entries'], countWeights).subscribe((n) => seen.push(n));
  await settled();

  const failed = db.write(['weight_entries'], async (inside) => {
    await addWeight(1)(inside);
    await inside.execute('INSERT INTO weight_entries (epoch_day, weight_kg) VALUES (2, 5)'); // too light to be real
  });
  await expect(failed).rejects.toBeInstanceOf(SqlFailure);
  await settled();
  expect(seen).toEqual([0]);
  expect(await db.read(countWeights), 'the first row of the failed write is undone').toBe(0);
  stop();
});

it('a query that fails is told to the subscriber, and later reads still arrive', async () => {
  const db = await AppDatabase.open(await openSql());
  const errors: unknown[] = [];
  const seen: unknown[] = [];
  let broken = true;
  const stop = db
    .watch(['weight_entries'], (inside) => (broken ? inside.select('SELECT * FROM no_such_table') : countWeights(inside)))
    .subscribe(
      (n) => seen.push(n),
      (error) => errors.push(error),
    );
  await settled();
  expect(errors.length).toBe(1);
  expect(errors[0]).toBeInstanceOf(SqlFailure);

  broken = false;
  await db.write(['weight_entries'], addWeight(1));
  await settled();
  expect(seen).toEqual([1]);
  stop();
});

it('two watchers of one table are each told', async () => {
  const db = await AppDatabase.open(await openSql());
  const a: unknown[] = [];
  const b: unknown[] = [];
  const stopA = db.watch(['weight_entries'], countWeights).subscribe((n) => a.push(n));
  const stopB = db.watch(['weight_entries', 'day_marks'], countWeights).subscribe((n) => b.push(n));
  await settled();
  await db.write(['weight_entries'], addWeight(1));
  await settled();
  expect(a).toEqual([0, 1]);
  expect(b).toEqual([0, 1]);
  stopA();
  stopB();
});
