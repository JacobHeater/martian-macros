import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// A pause the user set, one per start day (MM-148).
@DataClassName('PauseRow')
class Pauses extends Table {
  IntColumn get fromEpochDay => integer()();
  IntColumn get toEpochDay => integer()();
  TextColumn get reason => textEnum<PauseReason>()();
  BoolColumn get extended => boolean().withDefault(const Constant(false))();

  @override
  Set<Column<Object>> get primaryKey => {fromEpochDay};
}
