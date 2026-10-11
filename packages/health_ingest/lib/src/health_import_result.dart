import 'health_import_status.dart';

/// What one import did (MM-67).
final class HealthImportResult {
  const HealthImportResult(this.status, {this.upserted = 0, this.deleted = 0});

  final HealthImportStatus status;

  /// Readings added or brought up to date.
  final int upserted;

  /// Readings the platform reported as deleted.
  final int deleted;
}
