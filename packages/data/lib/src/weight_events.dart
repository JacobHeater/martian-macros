import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// A user-reported weight event, unique by date and kind.
@DataClassName('WeightEventRow')
class WeightEvents extends Table {
  IntColumn get dateEpochDay => integer()();
  TextColumn get type => textEnum<WeightEventType>()();

  @override
  Set<Column<Object>> get primaryKey => {dateEpochDay, type};
}
