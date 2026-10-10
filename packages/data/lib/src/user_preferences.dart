import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// Device-level display preferences. One row, id = 1; no row means defaults.
@DataClassName('PreferencesRow')
class UserPreferences extends Table {
  IntColumn get id => integer().check(id.equals(1))();

  TextColumn get themePreference =>
      textEnum<ThemePreference>().withDefault(const Constant('unselected'))();

  /// The easy-to-miss line (MM-152): on unless turned off, and the last day
  /// it was shown.
  BoolColumn get easyToMissEnabled =>
      boolean().withDefault(const Constant(true))();
  IntColumn get easyToMissLastShownEpochDay => integer().nullable()();

  /// How much nutrition to show (MM-49).
  TextColumn get detailLevel =>
      textEnum<DetailLevel>().withDefault(const Constant('standard'))();

  /// The day the under-eating notice was last dismissed (MM-114).
  IntColumn get underEatingDismissedEpochDay => integer().nullable()();

  /// The day the welcome-back screen was last put off (MM-147).
  IntColumn get returnScreenDismissedEpochDay => integer().nullable()();

  /// The day the weekly recovery check-in was last skipped (MM-116).
  IntColumn get recoveryCheckInSkippedEpochDay => integer().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
