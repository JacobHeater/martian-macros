import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [WeightEventRepository] must do.
void weightEventRepositoryContract(
  String name,
  WeightEventRepository Function() create,
) {
  group('$name as a WeightEventRepository', () {
    late WeightEventRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 2);

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchWeightEvents().first, isEmpty);
    });

    test('lists events oldest first', () async {
      await repo.saveWeightEvent(
        WeightEvent(date: d2, type: WeightEventType.illness),
      );
      await repo.saveWeightEvent(
        WeightEvent(date: d1, type: WeightEventType.travel),
      );
      final events = await repo.watchWeightEvents().first;
      expect(
        [for (final event in events) event.date.epochDay],
        [d1.epochDay, d2.epochDay],
      );
    });

    test('keeps one event per day and kind', () async {
      await repo.saveWeightEvent(
        WeightEvent(date: d1, type: WeightEventType.illness),
      );
      await repo.saveWeightEvent(
        WeightEvent(date: d1, type: WeightEventType.illness),
      );
      await repo.saveWeightEvent(
        WeightEvent(date: d1, type: WeightEventType.travel),
      );
      expect(await repo.watchWeightEvents().first, hasLength(2));
    });

    test('same-day events have the same stable kind ordering', () async {
      for (final type in WeightEventType.values.reversed) {
        await repo.saveWeightEvent(WeightEvent(date: d1, type: type));
      }
      final events = await repo.watchWeightEvents().first;
      expect(events.map((event) => event.type), WeightEventType.values);
    });

    test('deletes an event; deleting a missing event does nothing', () async {
      final event = WeightEvent(date: d1, type: WeightEventType.illness);
      await repo.saveWeightEvent(event);
      await repo.deleteWeightEvent(
        WeightEvent(date: d2, type: WeightEventType.illness),
      );
      expect(await repo.watchWeightEvents().first, hasLength(1));
      await repo.deleteWeightEvent(event);
      expect(await repo.watchWeightEvents().first, isEmpty);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchWeightEvents().map((events) => events.length),
        before: 0,
        change: () => repo.saveWeightEvent(
          WeightEvent(date: d1, type: WeightEventType.illness),
        ),
        after: 1,
      );
    });
  });
}
