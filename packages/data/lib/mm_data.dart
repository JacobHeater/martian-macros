/// Local persistence. The app opens an [AppDatabase] with a platform
/// executor and reaches it only through the repository interfaces from
/// `mm_domain` and `mm_engine`, implemented here over Drift.
library;

export 'src/app_database.dart' show AppDatabase;
export 'src/drift_repositories.dart';
export 'src/migration_step.dart';
export 'src/schema_migration_exception.dart';
