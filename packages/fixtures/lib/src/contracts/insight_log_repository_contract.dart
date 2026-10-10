import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// What every [InsightLogRepository] must do.
void insightLogRepositoryContract(
  String name,
  InsightLogRepository Function() create,
) {
  group('$name as an InsightLogRepository', () {
    late InsightLogRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 9);

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchInsightLog().first, isEmpty);
    });

    test('lists what was shown, oldest first', () async {
      await repo.recordInsightShown(InsightRule.stall, d2);
      await repo.recordInsightShown(InsightRule.proteinShort, d1);
      final log = await repo.watchInsightLog().first;
      expect(
        [for (final e in log) e.rule],
        [InsightRule.proteinShort, InsightRule.stall],
      );
      expect(log.first.shownOn, d1);
      expect(log.first.dismissedOn, isNull);
    });

    test('dismissing marks the latest showing of that rule only', () async {
      await repo.recordInsightShown(InsightRule.proteinShort, d1);
      await repo.recordInsightShown(InsightRule.stall, d1);
      await repo.recordInsightShown(InsightRule.proteinShort, d2);
      await repo.dismissInsight(InsightRule.proteinShort, d2.addDays(1));
      final log = await repo.watchInsightLog().first;
      final protein = [
        for (final e in log)
          if (e.rule == InsightRule.proteinShort) e,
      ];
      expect(protein.first.dismissedOn, isNull);
      expect(protein.last.dismissedOn, d2.addDays(1));
      expect(
        log.singleWhere((e) => e.rule == InsightRule.stall).dismissedOn,
        isNull,
      );
    });

    test('dismissing a rule never shown does nothing', () async {
      await repo.dismissInsight(InsightRule.stall, d1);
      expect(await repo.watchInsightLog().first, isEmpty);
    });
  });
}
