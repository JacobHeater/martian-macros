import type { SqlValue } from '../sql/SqlValue';

/**
 * Column names and their values. The names are written in this code and
 * never come from the user, which is why they may be put into SQL text.
 */
export type Values = Readonly<Record<string, SqlValue>>;
