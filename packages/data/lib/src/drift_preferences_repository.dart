import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [PreferencesRepository] over the Drift database. One row, id = 1; before
/// the user chooses anything the defaults apply.
final class DriftPreferencesRepository implements PreferencesRepository {
  DriftPreferencesRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<ThemePreference> watchThemePreference() => _db
      .select(_db.userPreferences)
      .watchSingleOrNull()
      .map((row) => row?.themePreference ?? ThemePreference.system);

  @override
  Stream<EasyToMissPreference> watchEasyToMiss() =>
      _db.select(_db.userPreferences).watchSingleOrNull().map((row) {
        if (row == null) return const EasyToMissPreference();
        final last = row.easyToMissLastShownEpochDay;
        return EasyToMissPreference(
          enabled: row.easyToMissEnabled,
          lastShown: last == null ? null : CalendarDate.fromEpochDay(last),
        );
      });

  @override
  Future<void> saveEasyToMissEnabled(bool enabled) => _db
      .into(_db.userPreferences)
      .insertOnConflictUpdate(
        UserPreferencesCompanion.insert(
          id: const Value(1),
          easyToMissEnabled: Value(enabled),
        ),
      );

  @override
  Future<void> markEasyToMissShown(CalendarDate day) => _db
      .into(_db.userPreferences)
      .insertOnConflictUpdate(
        UserPreferencesCompanion.insert(
          id: const Value(1),
          easyToMissLastShownEpochDay: Value(day.epochDay),
        ),
      );

  @override
  Future<void> saveThemePreference(ThemePreference preference) => _db
      .into(_db.userPreferences)
      .insertOnConflictUpdate(
        UserPreferencesCompanion.insert(
          id: const Value(1),
          themePreference: Value(preference),
        ),
      );
}
