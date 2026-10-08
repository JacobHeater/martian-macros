import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [WaistRepository] must do.
void waistRepositoryContract(String name, WaistRepository Function() create) {
  group('$name as a WaistRepository', () {
    late WaistRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 8);

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchWaist().first, isEmpty);
    });

    test('lists measurements oldest first and replaces a day', () async {
      await repo.saveWaist(d2, 90);
      await repo.saveWaist(d1, 92);
      await repo.saveWaist(d1, 91.5);
      final list = await repo.watchWaist().first;
      expect(
        [for (final w in list) w.date.epochDay],
        [d1.epochDay, d2.epochDay],
      );
      expect([for (final w in list) w.waistCm], [91.5, 90]);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchWaist().map((l) => l.length),
        before: 0,
        change: () => repo.saveWaist(d1, 92),
        after: 1,
      );
    });
  });
}
