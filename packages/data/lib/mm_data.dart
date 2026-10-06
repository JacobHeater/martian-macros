/// Local persistence. The app opens an [AppDatabase] with a platform
/// executor and talks to it only through [MmStore].
library;

export 'src/database.dart' show AppDatabase;
export 'src/store.dart';
