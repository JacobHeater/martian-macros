import 'package:drift/drift.dart';

@DataClassName('WaistRow')
class WaistEntries extends Table {
  IntColumn get epochDay => integer()();
  RealColumn get waistCm => real().check(waistCm.isBetweenValues(30, 300))();

  @override
  Set<Column<Object>> get primaryKey => {epochDay};
}
