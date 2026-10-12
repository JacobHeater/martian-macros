/**
 * SQLite refused a statement, or the database was used after it was closed
 * (MM-231). Every adapter throws this, whatever the library underneath
 * throws, so callers handle one kind of failure.
 */
export class SqlFailure extends Error {
  override readonly name = 'SqlFailure';
}
