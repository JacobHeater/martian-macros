import type { SqlDatabase } from '../sql/SqlDatabase';
import { placeholders } from './placeholders';
import type { Table } from './Table';
import type { Values } from './Values';

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
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders(columns.length)}) ` +
      `ON CONFLICT (${key.join(', ')}) ${onConflict}`,
    Object.values(values),
  );
}
