import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'day_marks.dart';
import 'food_entries.dart';
import 'migration_step.dart';
import 'schema_migration_exception.dart';
import 'setups.dart';
import 'targets_history.dart';
import 'waist_entries.dart';
import 'weight_entries.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    Setups,
    WeightEntries,
    FoodEntries,
    DayMarks,
    WaistEntries,
    TargetsHistory,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);

  /// Bump this with every change to a table, add the step to
  /// [migrationSteps], and run `mm schema` to export the new snapshot.
  static const currentSchemaVersion = 1;

  @override
  int get schemaVersion => currentSchemaVersion;

  /// One step per released version, keyed by the version it upgrades
  /// *from*. Step `n` takes a database at version `n` to version `n + 1`.
  /// Overridden only by tests.
  Map<int, MigrationStep> get migrationSteps => const {};

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      if (from > to) throw SchemaMigrationException.newerData(from, to);
      try {
        // All steps or none: a failure leaves the database at `from`.
        await transaction(() async {
          for (var version = from; version < to; version++) {
            final step = migrationSteps[version];
            if (step == null) {
              throw StateError('No migration from schema version $version.');
            }
            await step(m);
          }
        });
      } catch (cause) {
        throw SchemaMigrationException(from, to, cause);
      }
    },
  );
}
