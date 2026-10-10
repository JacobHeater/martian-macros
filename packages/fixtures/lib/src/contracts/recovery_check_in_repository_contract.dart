import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [RecoveryCheckInRepository] must do.
void recoveryCheckInRepositoryContract(
  String name,
  RecoveryCheckInRepository Function() create,
) {
  group('$name as a RecoveryCheckInRepository', () {
    late RecoveryCheckInRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 8);

    RecoveryCheckIn checkIn(CalendarDate date, {int hunger = 3}) =>
        RecoveryCheckIn(
          date: date,
          hunger: hunger,
          energy: 2,
          sleep: 4,
          training: 5,
          mood: 1,
        );

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchRecoveryCheckIns().first, isEmpty);
    });

    test('keeps every answer, and sleep hours when given', () async {
      await repo.saveRecoveryCheckIn(
        RecoveryCheckIn(
          date: d1,
          hunger: 1,
          energy: 2,
          sleep: 3,
          training: 4,
          mood: 5,
          sleepHours: 6.5,
        ),
      );
      final saved = (await repo.watchRecoveryCheckIns().first).single;
      expect(
        [for (final q in RecoveryQuestion.values) saved.answer(q)],
        [1, 2, 3, 4, 5],
      );
      expect(saved.sleepHours, 6.5);
      expect(saved.date, d1);
    });

    test('sleep hours are absent unless given', () async {
      await repo.saveRecoveryCheckIn(checkIn(d1));
      expect(
        (await repo.watchRecoveryCheckIns().first).single.sleepHours,
        isNull,
      );
    });

    test('lists oldest first; one per day, the later answer wins', () async {
      await repo.saveRecoveryCheckIn(checkIn(d2));
      await repo.saveRecoveryCheckIn(checkIn(d1));
      await repo.saveRecoveryCheckIn(checkIn(d1, hunger: 5));
      final saved = await repo.watchRecoveryCheckIns().first;
      expect([for (final c in saved) c.date], [d1, d2]);
      expect(saved.first.hunger, 5);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchRecoveryCheckIns().map((all) => all.length),
        before: 0,
        change: () => repo.saveRecoveryCheckIn(checkIn(d1)),
        after: 1,
      );
    });
  });
}
