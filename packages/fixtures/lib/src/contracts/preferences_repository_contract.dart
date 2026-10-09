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

    test('the easy-to-miss line is on and never shown until changed', () async {
      final p = await repo.watchEasyToMiss().first;
      expect(p.enabled, isTrue);
      expect(p.lastShown, isNull);
    });

    test('turning it off and recording a day keep each other', () async {
      final day = CalendarDate(2026, 10, 5);
      await repo.markEasyToMissShown(day);
      await repo.saveEasyToMissEnabled(false);
      var p = await repo.watchEasyToMiss().first;
      expect(p.enabled, isFalse);
      expect(p.lastShown, day);
      await repo.saveThemePreference(ThemePreference.dark);
      await repo.saveEasyToMissEnabled(true);
      p = await repo.watchEasyToMiss().first;
      expect(p.enabled, isTrue);
      expect(p.lastShown, day, reason: 'theme and setting are separate');
      expect(await repo.watchThemePreference().first, ThemePreference.dark);
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
