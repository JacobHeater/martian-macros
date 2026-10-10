import 'package:drift/drift.dart';

/// The recovery answers of one week, one row per day answered (MM-116).
/// Each answer is 1 to 5.
@DataClassName('RecoveryCheckInRow')
class RecoveryCheckIns extends Table {
  IntColumn get dateEpochDay => integer()();
  IntColumn get hunger => integer()();
  IntColumn get energy => integer()();
  IntColumn get sleep => integer()();
  IntColumn get training => integer()();
  IntColumn get mood => integer()();
  RealColumn get sleepHours => real().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {dateEpochDay};
}
