import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [WeightRepository] must do.
void weightRepositoryContract(String name, WeightRepository Function() create) {
  group('$name as a WeightRepository', () {
    late WeightRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 2);
    final d3 = CalendarDate(2026, 1, 3);

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchWeights().first, isEmpty);
    });

    test('lists weigh-ins oldest first', () async {
      await repo.saveWeight(d3, 82);
      await repo.saveWeight(d1, 80);
      await repo.saveWeight(d2, 81);
      final list = await repo.watchWeights().first;
      expect(
        [for (final w in list) w.date.epochDay],
        [d1.epochDay, d2.epochDay, d3.epochDay],
      );
      expect([for (final w in list) w.weightKg], [80, 81, 82]);
    });

    test('keeps one weigh-in per day: saving again replaces it', () async {
      await repo.saveWeight(d1, 80);
      await repo.saveWeight(d1, 79.4);
      final list = await repo.watchWeights().first;
      expect(list, hasLength(1));
      expect(list.single.weightKg, 79.4);
    });

    test('deletes a weigh-in; deleting a missing day does nothing', () async {
      await repo.saveWeight(d1, 80);
      await repo.deleteWeight(d2);
      expect(await repo.watchWeights().first, hasLength(1));
      await repo.deleteWeight(d1);
      expect(await repo.watchWeights().first, isEmpty);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchWeights().map((l) => l.length),
        before: 0,
        change: () => repo.saveWeight(d1, 80),
        after: 1,
      );
    });
  });
}
