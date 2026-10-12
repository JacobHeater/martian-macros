import { CalendarDate } from '../domain/CalendarDate';
import { byName } from '../lang/byName';
import { FormatError } from '../lang/FormatError';
import type { SqlRow } from '../sql/SqlRow';
import type { SqlValue } from '../sql/SqlValue';

/** A whole number or a fraction: SQLite gives back 80 for a stored 80.0. */
export function number(row: SqlRow, column: string): number {
  const value = row[column];
  if (typeof value !== 'number') throw new FormatError(`The stored ${column} is not a number.`);
  return value;
}

export function integer(row: SqlRow, column: string): number {
  const value = number(row, column);
  if (!Number.isInteger(value)) throw new FormatError(`The stored ${column} is not a whole number.`);
  return value;
}

export function text(row: SqlRow, column: string): string {
  const value = row[column];
  if (typeof value !== 'string') throw new FormatError(`The stored ${column} is not text.`);
  return value;
}

const absent = (row: SqlRow, column: string) => row[column] === null || row[column] === undefined;

export const optionalNumber = (row: SqlRow, column: string) => (absent(row, column) ? undefined : number(row, column));
export const optionalInteger = (row: SqlRow, column: string) => (absent(row, column) ? undefined : integer(row, column));
export const optionalText = (row: SqlRow, column: string) => (absent(row, column) ? undefined : text(row, column));

/** A yes or no, stored as 1 or 0. */
export const flag = (row: SqlRow, column: string) => integer(row, column) !== 0;

/** A calendar day, stored as days since 1970. */
export const day = (row: SqlRow, column: string) => CalendarDate.fromEpochDay(integer(row, column));
export const optionalDay = (row: SqlRow, column: string) => (absent(row, column) ? undefined : day(row, column));

/** A moment, stored as milliseconds since 1970. */
export const moment = (row: SqlRow, column: string) => new Date(integer(row, column));
export const optionalMoment = (row: SqlRow, column: string) => (absent(row, column) ? undefined : moment(row, column));

/** One of `values`, stored by its name. Anything else is refused, never defaulted. */
export const named = <T extends string>(values: readonly T[], row: SqlRow, column: string): T =>
  byName(values, text(row, column));
export const optionalNamed = <T extends string>(values: readonly T[], row: SqlRow, column: string) =>
  absent(row, column) ? undefined : named(values, row, column);

/** What is stored for a value that may be absent. */
export const orNull = (value: string | number | undefined): SqlValue => value ?? null;

/** What is stored for a yes or no. */
export const asFlag = (value: boolean): SqlValue => (value ? 1 : 0);
