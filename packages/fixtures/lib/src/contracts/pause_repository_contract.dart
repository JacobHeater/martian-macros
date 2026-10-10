import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [PauseRepository] must do.
void pauseRepositoryContract(String name, PauseRepository Function() create) {
  group('$name as a PauseRepository', () {
    late PauseRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 2, 1);

    Pause pause(CalendarDate from, {int days = 7, bool extended = false}) =>
        Pause(
          from: from,
          to: from.addDays(days - 1),
          reason: PauseReason.travel,
          extended: extended,
        );

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchPauses().first, isEmpty);
    });

    test('lists pauses oldest first, with every field', () async {
      await repo.savePause(pause(d2));
      await repo.savePause(
        Pause(
          from: d1,
          to: d1.addDays(2),
          reason: PauseReason.illness,
          extended: true,
        ),
      );
      final pauses = await repo.watchPauses().first;
      expect([for (final p in pauses) p.from], [d1, d2]);
      expect(pauses.first.to, d1.addDays(2));
      expect(pauses.first.reason, PauseReason.illness);
      expect(pauses.first.extended, isTrue);
      expect(pauses.last.extended, isFalse);
    });

    test('keeps one pause per start day; saving again replaces it', () async {
      await repo.savePause(pause(d1));
      await repo.savePause(pause(d1, days: 10, extended: true));
      final pauses = await repo.watchPauses().first;
      expect(pauses, hasLength(1));
      expect(pauses.single.days, 10);
      expect(pauses.single.extended, isTrue);
    });

    test('deletes a pause; deleting a missing one does nothing', () async {
      await repo.savePause(pause(d1));
      await repo.deletePause(pause(d2));
      expect(await repo.watchPauses().first, hasLength(1));
      await repo.deletePause(pause(d1));
      expect(await repo.watchPauses().first, isEmpty);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchPauses().map((pauses) => pauses.length),
        before: 0,
        change: () => repo.savePause(pause(d1)),
        after: 1,
      );
    });
  });
}
