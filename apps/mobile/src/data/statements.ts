import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlValue } from '../sql/SqlValue';
import { integer } from './columns';
import type { Table } from './schema';

/**
 * Column names and their values. The names are written in this code and
 * never come from the user, which is why they may be put into SQL text.
 */
export type Values = Readonly<Record<string, SqlValue>>;

const marks = (count: number) => Array.from({ length: count }, () => '?').join(', ');

/** Adds a row and gives the id SQLite assigned it. */
export async function insert(db: SqlDatabase, table: Table, values: Values): Promise<number> {
  const columns = Object.keys(values);
  await db.execute(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${marks(columns.length)})`,
    Object.values(values),
  );
  const id = (await db.select('SELECT last_insert_rowid() AS id'))[0];
  return integer(id ?? {}, 'id');
}

/**
 * Adds a row, or when one with the same `key` exists, changes the columns
 * given and leaves the others as they are.
 */
export async function upsert(db: SqlDatabase, table: Table, key: readonly string[], values: Values): Promise<void> {
  const columns = Object.keys(values);
  const others = columns.filter((column) => !key.includes(column));
  const onConflict =
    others.length === 0
      ? 'DO NOTHING'
      : `DO UPDATE SET ${others.map((column) => `${column} = excluded.${column}`).join(', ')}`;
  await db.execute(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${marks(columns.length)}) ` +
      `ON CONFLICT (${key.join(', ')}) ${onConflict}`,
    Object.values(values),
  );
}

/** Changes the columns given on the rows where `column` is `value`. */
export async function update(
  db: SqlDatabase,
  table: Table,
  values: Values,
  where: { column: string; value: SqlValue },
): Promise<void> {
  await db.execute(
    `UPDATE ${table} SET ${Object.keys(values)
      .map((column) => `${column} = ?`)
      .join(', ')} WHERE ${where.column} = ?`,
    [...Object.values(values), where.value],
  );
}
