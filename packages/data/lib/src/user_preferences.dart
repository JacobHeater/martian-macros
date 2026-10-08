import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// Device-level display preferences. One row, id = 1; no row means defaults.
@DataClassName('PreferencesRow')
class UserPreferences extends Table {
  IntColumn get id => integer().check(id.equals(1))();

  TextColumn get themePreference =>
      textEnum<ThemePreference>().withDefault(const Constant('system'))();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
