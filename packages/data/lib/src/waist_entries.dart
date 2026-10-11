import 'package:drift/drift.dart';

@DataClassName('WaistRow')
class WaistEntries extends Table {
  IntColumn get epochDay => integer()();
  RealColumn get waistCm => real().check(waistCm.isBetweenValues(30, 300))();

  /// The readings the measurement was taken from (MM-155): all three, the
  /// first alone for a quick entry, or none for an entry made before
  /// readings were kept.
  RealColumn get reading1Cm => real().nullable()();
  RealColumn get reading2Cm => real().nullable()();
  RealColumn get reading3Cm => real().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {epochDay};
}
