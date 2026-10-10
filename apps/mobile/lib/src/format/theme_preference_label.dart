import 'package:mm_domain/mm_domain.dart';

extension ThemePreferenceLabel on ThemePreference {
  String get label => switch (this) {
    ThemePreference.system => 'System',
    ThemePreference.light => 'Light',
    ThemePreference.dark => 'Dark',
    ThemePreference.martian => 'Martian',
    ThemePreference.unselected => 'Martian',
  };
}
