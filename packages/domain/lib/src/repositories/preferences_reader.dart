import '../theme_preference.dart';

/// Reads the user's device-level display preferences.
abstract interface class PreferencesReader {
  /// The current preference, then each change. Fresh installs return
  /// [ThemePreference.unselected] until the first-launch choice is confirmed.
  Stream<ThemePreference> watchThemePreference();
}
