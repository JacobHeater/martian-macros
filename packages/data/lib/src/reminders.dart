import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// One reminder's setting, one row per kind (MM-146).
@DataClassName('ReminderRow')
class Reminders extends Table {
  TextColumn get kind => textEnum<ReminderKind>()();
  BoolColumn get enabled => boolean()();
  IntColumn get minuteOfDay => integer()();
  IntColumn get countFromEpochDay => integer().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {kind};
}
