import 'package:mm_data/mm_data.dart';

/// A future schema, standing in for versions that do not exist yet so the
/// migration machinery is proven before a feature depends on it.
class LaterDatabase extends AppDatabase {
  LaterDatabase(super.executor, this.version, this.steps);

  final int version;
  final Map<int, MigrationStep> steps;

  @override
  int get schemaVersion => version;

  @override
  Map<int, MigrationStep> get migrationSteps => steps;
}
