import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-141: insights from a fixed catalog of rules, rationed.
void main() {
  final through = CalendarDate(2026, 3, 14);
  final today = through.addDays(1);

  TargetsRecord targets({double proteinMinimumG = 130}) => TargetsRecord(
    effectiveFrom: through.addDays(-60),
    mode: GoalMode.fatLoss,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 200,
    tdeeStatus: TdeeStatus.updated,
    targets: DailyTargets(
      kcal: 2100,
      proteinG: 160,
      proteinMinimumG: proteinMinimumG,
      fatG: 70,
      carbsG: 220,
      weeklyRateFraction: -0.005,
    ),
  );

  IntakeDay day(
    int daysAgo, {
    double kcal = 2100,
    double protein = 150,
    DayCompleteness mark = DayCompleteness.complete,
    double estimatedShare = 0,
  }) => IntakeDay(
    date: through.addDays(-daysAgo),
    kcal: kcal,
    proteinG: protein,
    carbsG: 200,
    fatG: 70,
    completeness: mark,
    estimatedShare: estimatedShare,
  );

  List<WeightObservation> weighed(int count) => [
    for (var i = 0; i < count; i++)
      WeightObservation(date: through.addDays(-i), weightKg: 85),
    WeightObservation(date: through.addDays(-40), weightKg: 86),
  ];

  List<Insight> find({
    List<IntakeDay>? intake,
    int weighIns = 14,
    StallAssessment? stall,
    bool limited = false,
  }) => findInsights(
    through: through,
    intake: intake ?? [for (var i = 0; i < 14; i++) day(i)],
    weights: weighed(weighIns),
    history: [targets()],
    stall: stall,
    limitToProteinAndLogging: limited,
  );

  const stalled = StallAssessment(
    status: StallStatus.stalled,
    windowDays: 21,
    diagnosis: StallDiagnosis.estimate,
  );

  group('the catalog', () {
    test('a steady, well-logged fortnight produces nothing', () {
      expect(find(), isEmpty);
    });

    test('protein short states the days and the average shortfall', () {
      final insights = find(
        intake: [
          for (var i = 0; i < 5; i++) day(i),
          for (var i = 5; i < 14; i++) day(i, protein: 102),
        ],
      );
      final i = insights.single;
      expect(i.rule, InsightRule.proteinShort);
      expect(i.figures['wholeDays'], 14);
      expect(i.figures['metDays'], 5);
      expect(i.figures['averageShortfallG'], closeTo(28, 1e-9));
      expect(i.basisDays, 14);
    });

    test('protein met on half the days or more says nothing', () {
      expect(
        find(
          intake: [
            for (var i = 0; i < 7; i++) day(i),
            for (var i = 7; i < 14; i++) day(i, protein: 100),
          ],
        ),
        isEmpty,
      );
    });

    test('more than a third of logged days partial', () {
      final i = find(
        intake: [
          for (var i = 0; i < 8; i++) day(i),
          for (var i = 8; i < 13; i++)
            day(i, kcal: 700, mark: DayCompleteness.partial),
        ],
      ).single;
      expect(i.rule, InsightRule.partialDays);
      expect(i.figures['loggedDays'], 13);
      expect(i.figures['partialDays'], 5);
    });

    test('estimates above half of calories', () {
      final i = find(
        intake: [for (var i = 0; i < 14; i++) day(i, estimatedShare: 0.6)],
      ).single;
      expect(i.rule, InsightRule.estimatesRising);
      expect(i.figures['estimatedShare'], closeTo(0.6, 1e-9));
    });

    test('fewer than four weigh-ins a week', () {
      final i = find(weighIns: 5).single;
      expect(i.rule, InsightRule.weighInTiming);
      expect(i.figures['weighIns'], 5);
      expect(find(weighIns: 8), isEmpty);
    });

    test('a stall arrives as an insight with its diagnosis', () {
      final i = find(stall: stalled).single;
      expect(i.rule, InsightRule.stall);
      expect(i.stall!.diagnosis, StallDiagnosis.estimate);
      expect(i.basisDays, 21);
    });

    test('a single day far over target is not an insight', () {
      expect(
        find(intake: [day(0, kcal: 3000), for (var i = 1; i < 14; i++) day(i)]),
        isEmpty,
      );
    });

    test('too few days is not a pattern', () {
      expect(
        find(intake: [for (var i = 0; i < 5; i++) day(i, protein: 60)]),
        isEmpty,
      );
    });

    test('every insight rests on at least seven days', () {
      final all = find(
        intake: [
          for (var i = 0; i < 9; i++) day(i, protein: 90, estimatedShare: 0.7),
          for (var i = 9; i < 14; i++)
            day(i, kcal: 600, mark: DayCompleteness.partial),
        ],
        weighIns: 3,
        stall: stalled,
      );
      expect(all, hasLength(5));
      for (final i in all) {
        expect(i.basisDays, greaterThanOrEqualTo(7), reason: i.rule.name);
      }
    });

    test('they come highest priority first', () {
      final all = find(
        intake: [
          for (var i = 0; i < 9; i++) day(i, protein: 90, estimatedShare: 0.7),
          for (var i = 9; i < 14; i++)
            day(i, kcal: 600, mark: DayCompleteness.partial),
        ],
        weighIns: 3,
        stall: stalled,
      );
      expect(
        [for (final i in all) i.rule],
        [
          InsightRule.partialDays,
          InsightRule.estimatesRising,
          InsightRule.weighInTiming,
          InsightRule.stall,
          InsightRule.proteinShort,
        ],
      );
    });

    test('with an eating-disorder history nothing is about weight', () {
      final all = find(
        intake: [for (var i = 0; i < 14; i++) day(i, protein: 90)],
        weighIns: 3,
        stall: stalled,
        limited: true,
      );
      expect([for (final i in all) i.rule], [InsightRule.proteinShort]);
    });
  });

  group('rationing', () {
    Insight insight(InsightRule rule) =>
        Insight(rule: rule, from: through.addDays(-13), to: through);
    final five = [
      insight(InsightRule.partialDays),
      insight(InsightRule.estimatesRising),
      insight(InsightRule.weighInTiming),
      insight(InsightRule.stall),
      insight(InsightRule.proteinShort),
    ];
    InsightLogEntry shown(
      InsightRule rule,
      int daysAgo, {
      int? dismissedDaysAgo,
    }) => InsightLogEntry(
      rule: rule,
      shownOn: today.addDays(-daysAgo),
      dismissedOn: dismissedDaysAgo == null
          ? null
          : today.addDays(-dismissedDaysAgo),
    );

    test('with five rules satisfied, one is shown: the highest priority', () {
      final s = selectInsight(candidates: five, log: const [], today: today)!;
      expect(s.insight.rule, InsightRule.partialDays);
      expect(s.isNew, isTrue);
    });

    test('one new insight a day', () {
      final s = selectInsight(
        candidates: five,
        log: [shown(InsightRule.partialDays, 0, dismissedDaysAgo: 0)],
        today: today,
      );
      expect(s, isNull);
    });

    test('three new insights a week', () {
      final log = [
        shown(InsightRule.partialDays, 5, dismissedDaysAgo: 5),
        shown(InsightRule.estimatesRising, 3, dismissedDaysAgo: 3),
        shown(InsightRule.weighInTiming, 1, dismissedDaysAgo: 1),
      ];
      expect(selectInsight(candidates: five, log: log, today: today), isNull);
      final later = selectInsight(
        candidates: five,
        log: log,
        today: today.addDays(2),
      )!;
      expect(later.insight.rule, InsightRule.stall);
    });

    test('an insight that is showing keeps showing', () {
      final s = selectInsight(
        candidates: five,
        log: [shown(InsightRule.stall, 4)],
        today: today,
      )!;
      expect(s.insight.rule, InsightRule.stall);
      expect(s.isNew, isFalse);
    });

    test('dismissed, a rule stays away for 28 days', () {
      final only = [insight(InsightRule.proteinShort)];
      expect(
        selectInsight(
          candidates: only,
          log: [shown(InsightRule.proteinShort, 12, dismissedDaysAgo: 10)],
          today: today,
        ),
        isNull,
      );
      final back = selectInsight(
        candidates: only,
        log: [shown(InsightRule.proteinShort, 30, dismissedDaysAgo: 28)],
        today: today,
      )!;
      expect(back.isNew, isTrue);
    });

    test('with no candidates there is nothing to show', () {
      expect(
        selectInsight(candidates: const [], log: const [], today: today),
        isNull,
      );
    });
  });
}
