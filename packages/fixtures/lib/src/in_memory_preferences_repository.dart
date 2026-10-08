import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [PreferencesRepository] held in memory.
final class InMemoryPreferencesRepository implements PreferencesRepository {
  final _theme = ObservableValue<ThemePreference>(ThemePreference.system);

  @override
  Stream<ThemePreference> watchThemePreference() => _theme.watch();

  @override
  Future<void> saveThemePreference(ThemePreference preference) async =>
      _theme.value = preference;

  /// Back to the defaults (used by [InMemoryDataEraser]).
  void clear() => _theme.value = ThemePreference.system;
}
