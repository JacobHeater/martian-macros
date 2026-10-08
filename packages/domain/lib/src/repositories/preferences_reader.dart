import '../theme_preference.dart';

/// Reads the user's device-level display preferences.
abstract interface class PreferencesReader {
  /// The current theme preference, then each change. [ThemePreference.system]
  /// until the user chooses.
  Stream<ThemePreference> watchThemePreference();
}
