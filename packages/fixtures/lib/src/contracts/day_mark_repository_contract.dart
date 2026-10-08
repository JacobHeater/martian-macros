import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [DayMarkRepository] must do.
void dayMarkRepositoryContract(
  String name,
  DayMarkRepository Function() create,
) {
  group('$name as a DayMarkRepository', () {
    late DayMarkRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 2);

    setUp(() => repo = create());

    test('an unmarked day is DayCompleteness.unmarked', () async {
      expect(await repo.watchCompleteness(d1).first, DayCompleteness.unmarked);
    });

    test('a mark applies to its day only and can be changed', () async {
      await repo.setCompleteness(d1, DayCompleteness.complete);
      expect(await repo.watchCompleteness(d1).first, DayCompleteness.complete);
      expect(await repo.watchCompleteness(d2).first, DayCompleteness.unmarked);
      await repo.setCompleteness(d1, DayCompleteness.partial);
      expect(await repo.watchCompleteness(d1).first, DayCompleteness.partial);
    });

    test('emits the current mark first, then each change', () async {
      await expectChangeEmits(
        repo.watchCompleteness(d1),
        before: DayCompleteness.unmarked,
        change: () => repo.setCompleteness(d1, DayCompleteness.complete),
        after: DayCompleteness.complete,
      );
    });
  });
}
