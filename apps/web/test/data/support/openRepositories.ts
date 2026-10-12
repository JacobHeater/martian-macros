import { afterEach } from 'vitest';
import { SqlRepositories } from '../../../src/data/SqlRepositories';
import type { SqlDatabase } from '../../../src/sql/SqlDatabase';
import { WasmSqlDatabase } from '../../../src/sql/wasm/WasmSqlDatabase';

const open: SqlDatabase[] = [];

afterEach(async () => {
  for (const sql of open.splice(0)) await sql.close().catch(() => undefined);
});

/** A new database in memory, closed when the test ends. */
export async function openSql(options?: { bytes?: Uint8Array }): Promise<WasmSqlDatabase> {
  const sql = await WasmSqlDatabase.open(options);
  open.push(sql);
  return sql;
}

/** Every repository over a new database in memory, closed when the test ends. */
export async function openRepositories(): Promise<SqlRepositories> {
  return SqlRepositories.open(await openSql());
}
