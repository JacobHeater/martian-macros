import 'package:drift/drift.dart';

/// Upgrades the schema by exactly one version.
typedef MigrationStep = Future<void> Function(Migrator m);
