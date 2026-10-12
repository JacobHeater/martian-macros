import 'package:drift/drift.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

/// Readings imported from a health platform (MM-67), apart from anything
/// the user typed. One row per platform reading: importing again replaces
/// it, never duplicates it.
@DataClassName('ImportedSampleRow')
class ImportedSamples extends Table {
  TextColumn get type => textEnum<HealthDataType>()();

  /// The platform's own id for the reading.
  TextColumn get platformId => text()();

  /// In the unit of [type].
  RealColumn get value => real()();
  IntColumn get startMs => integer()();
  IntColumn get endMs => integer().nullable()();

  /// The app or device that wrote it, and its name as shown.
  TextColumn get sourceId => text()();
  TextColumn get sourceName => text()();

  @override
  Set<Column<Object>> get primaryKey => {type, platformId};
}
