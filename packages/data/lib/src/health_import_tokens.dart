import 'package:drift/drift.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

/// Where the last import of each type left off (MM-67): the platform's
/// token to ask for changes with.
@DataClassName('HealthImportTokenRow')
class HealthImportTokens extends Table {
  TextColumn get type => textEnum<HealthDataType>()();
  TextColumn get token => text()();

  @override
  Set<Column<Object>> get primaryKey => {type};
}
