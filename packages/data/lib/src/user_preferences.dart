import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// Device-level display preferences. One row, id = 1; no row means defaults.
@DataClassName('PreferencesRow')
class UserPreferences extends Table {
  IntColumn get id => integer().check(id.equals(1))();

  TextColumn get themePreference =>
      textEnum<ThemePreference>().withDefault(const Constant('system'))();

  /// The easy-to-miss line (MM-152): on unless turned off, and the last day
  /// it was shown.
  BoolColumn get easyToMissEnabled =>
      boolean().withDefault(const Constant(true))();
  IntColumn get easyToMissLastShownEpochDay => integer().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
