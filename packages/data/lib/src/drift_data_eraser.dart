import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [DataEraser] over the Drift database: empties every table in one
/// transaction.
final class DriftDataEraser implements DataEraser {
  DriftDataEraser(this._db);

  final AppDatabase _db;

  @override
  Future<void> eraseAll() => _db.transaction(() async {
    for (final table in _db.allTables) {
      await _db.delete(table).go();
    }
  });
}
