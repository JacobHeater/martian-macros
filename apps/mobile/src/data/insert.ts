import type { SqlDatabase } from '../sql/SqlDatabase';
import { integer } from './columns';
import { placeholders } from './placeholders';
import type { Table } from './Table';
import type { Values } from './Values';

/** Adds a row and gives the id SQLite assigned it. */
export async function insert(db: SqlDatabase, table: Table, values: Values): Promise<number> {
  const columns = Object.keys(values);
  await db.execute(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders(columns.length)})`,
    Object.values(values),
  );
  const id = (await db.select('SELECT last_insert_rowid() AS id'))[0];
  return integer(id ?? {}, 'id');
}
