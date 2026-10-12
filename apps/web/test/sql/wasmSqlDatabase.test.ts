import { expect, it } from 'vitest';
import { SqlFailure } from '../../src/sql/SqlFailure';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import { sqlDatabaseContract } from '../contracts/sqlDatabaseContract';

sqlDatabaseContract('The WebAssembly build', () => WasmSqlDatabase.open());

/** MM-231: what only this adapter does, which is how a pack file is read and written. */
it('a database can be written out as a file and opened again from its bytes', async () => {
  const first = await WasmSqlDatabase.open();
  await first.executeScript('CREATE TABLE header (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID');
  await first.execute('INSERT INTO header (key, value) VALUES (?, ?)', ['pack_id', 'test']);
  await first.execute('PRAGMA user_version = 1');
  const bytes = await first.exportBytes();
  await first.close();

  // What a SQLite file begins with.
  expect(new TextDecoder().decode(bytes.slice(0, 15))).toBe('SQLite format 3');

  const second = await WasmSqlDatabase.open({ bytes });
  expect(await second.select('SELECT key, value FROM header')).toEqual([{ key: 'pack_id', value: 'test' }]);
  expect((await second.select('PRAGMA user_version'))[0]?.['user_version']).toBe(1);
  await second.close();
});

it('two databases open at once are separate', async () => {
  const a = await WasmSqlDatabase.open();
  const b = await WasmSqlDatabase.open();
  await a.executeScript('CREATE TABLE only_in_a (x)');
  await expect(b.select('SELECT * FROM only_in_a')).rejects.toBeInstanceOf(SqlFailure);
  await a.close();
  await b.close();
});

it('bytes that are not a database are refused', async () => {
  await expect(WasmSqlDatabase.open({ bytes: new TextEncoder().encode('this is not a database file') })).rejects.toBeInstanceOf(
    SqlFailure,
  );
});
