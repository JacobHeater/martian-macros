import 'package:mm_domain/mm_domain.dart';

/// A failed first write followed by a real repository write on retry.
class RetryThemeWriter implements PreferencesWriter {
  RetryThemeWriter(this.delegate);

  final PreferencesWriter delegate;
  bool fail = true;
  int calls = 0;

  @override
  Future<void> saveThemePreference(ThemePreference preference) async {
    calls++;
    if (fail) throw Exception('theme storage unavailable');
    await delegate.saveThemePreference(preference);
  }
}
