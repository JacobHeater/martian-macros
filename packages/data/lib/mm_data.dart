/// Local persistence. The app opens an [AppDatabase] with a platform
/// executor and talks to it only through [MmStore].
library;

export 'src/app_database.dart' show AppDatabase;
export 'src/migration_step.dart';
export 'src/mm_store.dart';
export 'src/schema_migration_exception.dart';
