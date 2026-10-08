import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [PreferencesRepository] must do.
void preferencesRepositoryContract(
  String name,
  PreferencesRepository Function() create,
) {
  group('$name as a PreferencesRepository', () {
    late PreferencesRepository repo;
    setUp(() => repo = create());

    test('follows the system until the user chooses', () async {
      expect(await repo.watchThemePreference().first, ThemePreference.system);
    });

    test('keeps each choice, and a later one replaces it', () async {
      for (final choice in ThemePreference.values) {
        await repo.saveThemePreference(choice);
        expect(await repo.watchThemePreference().first, choice);
      }
      await repo.saveThemePreference(ThemePreference.dark);
      await repo.saveThemePreference(ThemePreference.light);
      expect(await repo.watchThemePreference().first, ThemePreference.light);
    });

    test('emits the current choice first, then each change', () async {
      await expectChangeEmits(
        repo.watchThemePreference(),
        before: ThemePreference.system,
        change: () => repo.saveThemePreference(ThemePreference.dark),
        after: ThemePreference.dark,
      );
    });
  });
}
