/// The stored database could not be brought to the current schema. The
/// upgrade ran in a transaction, so the stored data is unchanged.
final class SchemaMigrationException implements Exception {
  SchemaMigrationException(this.from, this.to, this.cause);

  /// The data was written by a newer version of the app than this one.
  SchemaMigrationException.newerData(this.from, this.to) : cause = null;

  final int from;
  final int to;
  final Object? cause;

  @override
  String toString() => cause == null
      ? 'This data was saved by a newer version of the app (data version '
            '$from, app version $to). Your data is safe and unchanged. '
            'Update the app to open it.'
      : 'Your data is safe and unchanged, but it could not be upgraded '
            'from version $from to version $to. Cause: $cause';
}
