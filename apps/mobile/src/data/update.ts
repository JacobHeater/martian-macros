import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlValue } from '../sql/SqlValue';
import type { Table } from './Table';
import type { Values } from './Values';

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
