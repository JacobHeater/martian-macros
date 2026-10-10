import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [PreferencesRepository] held in memory.
final class InMemoryPreferencesRepository implements PreferencesRepository {
  final _theme = ObservableValue<ThemePreference>(ThemePreference.unselected);

  @override
  Stream<ThemePreference> watchThemePreference() => _theme.watch();

  final _easyToMiss = ObservableValue<EasyToMissPreference>(
    const EasyToMissPreference(),
  );

  @override
  Stream<EasyToMissPreference> watchEasyToMiss() => _easyToMiss.watch();

  @override
  Future<void> saveEasyToMissEnabled(bool enabled) async =>
      _easyToMiss.value = EasyToMissPreference(
        enabled: enabled,
        lastShown: _easyToMiss.value.lastShown,
      );

  @override
  Future<void> markEasyToMissShown(CalendarDate day) async =>
      _easyToMiss.value = EasyToMissPreference(
        enabled: _easyToMiss.value.enabled,
        lastShown: day,
      );

  final _detail = ObservableValue<DetailLevel>(DetailLevel.standard);

  @override
  Stream<DetailLevel> watchDetailLevel() => _detail.watch();

  @override
  Future<void> saveDetailLevel(DetailLevel level) async =>
      _detail.value = level;

  final _underEatingDismissed = ObservableValue<CalendarDate?>(null);

  @override
  Stream<CalendarDate?> watchUnderEatingDismissedOn() =>
      _underEatingDismissed.watch();

  @override
  Future<void> saveUnderEatingDismissedOn(CalendarDate day) async =>
      _underEatingDismissed.value = day;

  final _returnDismissed = ObservableValue<CalendarDate?>(null);

  @override
  Stream<CalendarDate?> watchReturnScreenDismissedOn() =>
      _returnDismissed.watch();

  @override
  Future<void> saveReturnScreenDismissedOn(CalendarDate day) async =>
      _returnDismissed.value = day;

  final _recoverySkipped = ObservableValue<CalendarDate?>(null);

  @override
  Stream<CalendarDate?> watchRecoveryCheckInSkippedOn() =>
      _recoverySkipped.watch();

  @override
  Future<void> saveRecoveryCheckInSkippedOn(CalendarDate day) async =>
      _recoverySkipped.value = day;

  @override
  Future<void> saveThemePreference(ThemePreference preference) async =>
      _theme.value = preference;

  /// Back to the defaults (used by [InMemoryDataEraser]).
  void clear() {
    _theme.value = ThemePreference.unselected;
    _easyToMiss.value = const EasyToMissPreference();
    _detail.value = DetailLevel.standard;
    _underEatingDismissed.value = null;
    _returnDismissed.value = null;
    _recoverySkipped.value = null;
  }
}
