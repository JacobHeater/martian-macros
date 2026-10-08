import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// Whether the user marked a day's log complete or partial.
@DataClassName('DayMarkRow')
class DayMarks extends Table {
  IntColumn get epochDay => integer()();
  TextColumn get completeness => textEnum<DayCompleteness>()();

  @override
  Set<Column<Object>> get primaryKey => {epochDay};
}
