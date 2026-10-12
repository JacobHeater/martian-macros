import type { SqlValue } from './SqlValue';

/** One row of a result, by column name. */
export type SqlRow = Readonly<Record<string, SqlValue>>;
