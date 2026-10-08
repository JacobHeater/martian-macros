import 'package:drift/drift.dart';

/// The canonical weigh-in for each calendar day.
@DataClassName('WeightRow')
class WeightEntries extends Table {
  IntColumn get epochDay => integer()();
  RealColumn get weightKg => real().check(weightKg.isBetweenValues(20, 500))();
  TextColumn get deviceId => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {epochDay};
}
