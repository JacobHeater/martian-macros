import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

TargetsRecord _record(
  CalendarDate from,
  double kcal, {
  Set<TargetFlag>? flags,
  double? safetyBodyFatPercent,
  int profileRevision = 0,
  TargetsExplanation? explanation,
}) => TargetsRecord(
  effectiveFrom: from,
  mode: GoalMode.fatLoss,
  tdeeKcal: 2600,
  tdeeSigmaKcal: 300,
  tdeeStatus: TdeeStatus.held,
  safetyBodyFatPercent: safetyBodyFatPercent,
  profileRevision: profileRevision,
  explanation: explanation,
  targets: DailyTargets(
    kcal: kcal,
    proteinG: 160,
    fatG: 70,
    carbsG: 200,
    weeklyRateFraction: -0.0075,
    flags: flags ?? const {},
  ),
);

/// What every [TargetsHistoryRepository] must do.
void targetsHistoryRepositoryContract(
  String name,
  TargetsHistoryRepository Function() create,
) {
  group('$name as a TargetsHistoryRepository', () {
    late TargetsHistoryRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 8);

    setUp(() => repo = create());

    test('keeps the body-fat figure the safety rules used, or none', () async {
      await repo.saveTargets(_record(d1, 2200, safetyBodyFatPercent: 14.63));
      await repo.saveTargets(_record(d2, 2300));
      final history = await repo.watchTargetsHistory().first;
      expect(history.first.safetyBodyFatPercent, closeTo(14.63, 1e-9));
      expect(history.last.safetyBodyFatPercent, isNull);
    });

    test('keeps the profile revision the targets were made for', () async {
      await repo.saveTargets(_record(d1, 2200, profileRevision: 2));
      await repo.saveTargets(_record(d2, 2300));
      final history = await repo.watchTargetsHistory().first;
      expect(history.first.profileRevision, 2);
      expect(history.last.profileRevision, 0);
    });

    test('keeps why the targets were issued, or none', () async {
      final why = TargetsExplanation(
        lines: const [
          ExplanationLine(
            ExplanationReason.expenditureEstimate,
            -90,
            from: 2950,
            to: 2860,
          ),
          ExplanationLine(ExplanationReason.stepLimit, 15),
        ],
        previousKcal: 2400,
        newKcal: 2325,
        estimateStatus: TdeeStatus.updated,
        usableIntakeDays: 12,
        excludedPartialDays: 2,
        weighIns: 11,
      );
      await repo.saveTargets(_record(d1, 2325, explanation: why));
      await repo.saveTargets(_record(d2, 2300));
      final history = await repo.watchTargetsHistory().first;
      final back = history.first.explanation!;
      expect(back.newKcal, 2325);
      expect(back.previousKcal, 2400);
      expect(back.weighIns, 11);
      expect(
        [for (final l in back.lines) (l.reason, l.kcal, l.from, l.to)],
        [for (final l in why.lines) (l.reason, l.kcal, l.from, l.to)],
      );
      expect(history.last.explanation, isNull);
    });

    test('starts empty', () async {
      expect(await repo.watchTargetsHistory().first, isEmpty);
    });

    test('lists records oldest first', () async {
      await repo.saveTargets(_record(d2, 2000));
      await repo.saveTargets(_record(d1, 2100));
      final list = await repo.watchTargetsHistory().first;
      expect([for (final r in list) r.targets.kcal], [2100, 2000]);
    });

    test('a record for the same day replaces the earlier one', () async {
      await repo.saveTargets(_record(d1, 2100));
      await repo.saveTargets(_record(d1, 1900));
      final list = await repo.watchTargetsHistory().first;
      expect(list, hasLength(1));
      expect(list.single.targets.kcal, 1900);
    });

    test('keeps the estimate and the flags', () async {
      await repo.saveTargets(
        _record(
          d1,
          2000,
          flags: {TargetFlag.values.first, TargetFlag.values.last},
        ),
      );
      final r = (await repo.watchTargetsHistory().first).single;
      expect(r.tdeeKcal, 2600);
      expect(r.tdeeSigmaKcal, 300);
      expect(r.tdeeStatus, TdeeStatus.held);
      expect(r.mode, GoalMode.fatLoss);
      expect(r.targets.flags, {
        TargetFlag.values.first,
        TargetFlag.values.last,
      });
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchTargetsHistory().map((l) => l.length),
        before: 0,
        change: () => repo.saveTargets(_record(d1, 2000)),
        after: 1,
      );
    });
  });
}
