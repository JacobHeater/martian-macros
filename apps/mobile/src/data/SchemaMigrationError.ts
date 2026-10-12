/**
 * The database could not be opened at this app's schema version. The data
 * is unchanged either way.
 */
export class SchemaMigrationError extends Error {
  override readonly name = 'SchemaMigrationError';
  readonly from: number;
  readonly to: number;
  override readonly cause: unknown;

  constructor(from: number, to: number, cause: unknown) {
    super(
      cause === undefined
        ? `This data was saved by a newer version of the app (data version ${from}, app version ${to}). ` +
            'Your data is safe and unchanged. Update the app to open it.'
        : 'Your data is safe and unchanged, but it could not be upgraded ' +
            `from version ${from} to version ${to}. Cause: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    this.from = from;
    this.to = to;
    this.cause = cause;
  }

  /** The data was saved by a newer version of the app than this one. */
  static newerData(from: number, to: number): SchemaMigrationError {
    return new SchemaMigrationError(from, to, undefined);
  }
}
