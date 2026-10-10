import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [ReminderRepository] must do.
void reminderRepositoryContract(
  String name,
  ReminderRepository Function() create,
) {
  group('$name as a ReminderRepository', () {
    late ReminderRepository repo;
    final day = CalendarDate(2026, 1, 1);

    setUp(() => repo = create());

    test('starts empty: nothing is on until the user turns it on', () async {
      expect(await repo.watchReminders().first, isEmpty);
    });

    test('keeps every field', () async {
      await repo.saveReminder(
        ReminderSetting(
          kind: ReminderKind.logFood,
          enabled: true,
          minuteOfDay: 19 * 60 + 30,
          countFrom: day,
        ),
      );
      final saved = (await repo.watchReminders().first).single;
      expect(saved.kind, ReminderKind.logFood);
      expect(saved.enabled, isTrue);
      expect(saved.minuteOfDay, 19 * 60 + 30);
      expect(saved.countFrom, day);
    });

    test('a setting that was never on has no count-from day', () async {
      await repo.saveReminder(
        const ReminderSetting(kind: ReminderKind.weighIn, minuteOfDay: 420),
      );
      final saved = (await repo.watchReminders().first).single;
      expect(saved.enabled, isFalse);
      expect(saved.countFrom, isNull);
    });

    test('keeps one setting per kind, listed in the order of kinds', () async {
      for (final kind in ReminderKind.values.reversed) {
        await repo.saveReminder(ReminderSetting(kind: kind, minuteOfDay: 480));
      }
      await repo.saveReminder(
        const ReminderSetting(kind: ReminderKind.weighIn, minuteOfDay: 400),
      );
      final saved = await repo.watchReminders().first;
      expect([for (final s in saved) s.kind], ReminderKind.values);
      expect(saved.first.minuteOfDay, 400);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchReminders().map((settings) => settings.length),
        before: 0,
        change: () => repo.saveReminder(
          const ReminderSetting(kind: ReminderKind.weighIn, minuteOfDay: 420),
        ),
        after: 1,
      );
    });
  });
}
