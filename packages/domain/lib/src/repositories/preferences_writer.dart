import '../theme_preference.dart';

/// Writes the user's device-level display preferences.
abstract interface class PreferencesWriter {
  Future<void> saveThemePreference(ThemePreference preference);
}
