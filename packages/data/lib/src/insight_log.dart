import 'package:drift/drift.dart';
import 'package:mm_engine/mm_engine.dart';

/// Each time an insight from a rule started showing, and when it was
/// dismissed (MM-141). The rationing reads this.
@DataClassName('InsightLogRow')
class InsightLog extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get rule => textEnum<InsightRule>()();
  IntColumn get shownEpochDay => integer()();
  IntColumn get dismissedEpochDay => integer().nullable()();
}
