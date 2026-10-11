import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-133: an honest review of a stretch on recomp.
void main() {
  final today = CalendarDate(2026, 10, 11);
  final squat = builtInExercises.firstWhere((e) => e.id == 'back-squat');
  const eligible = ModeRecommendation(
    GoalMode.recomp,
    ModeReason.recompEligible,
  );
  const lean = ModeRecommendation(GoalMode.leanGain, ModeReason.leanAndTrained);
  const cutFirst = ModeRecommendation(GoalMode.fatLoss, ModeReason.cutFirst);

  TargetsRecord record(int daysAgo, [GoalMode mode = GoalMode.recomp]) =>
      TargetsRecord(
        effectiveFrom: today.addDays(-daysAgo),
        mode: mode,
        tdeeKcal: 2500,
        tdeeSigmaKcal: 150,
        tdeeStatus: TdeeStatus.updated,
        targets: const DailyTargets(
          kcal: 2400,
          proteinG: 160,
          fatG: 70,
          carbsG: 250,
          weeklyRateFraction: -0.001,
        ),
      );

  /// On recomp for [days], with a check-in every week.
  List<TargetsRecord> onRecompFor(int days) => [
    for (var d = days; d >= 0; d -= 7) record(d),
  ];

  /// A trend that went from [fromKg] to [toKg] over the last [days].
  List<WeightTrendPoint> trend(double fromKg, double toKg, {int days = 84}) => [
    for (var daysAgo = 120; daysAgo >= 0; daysAgo--)
      WeightTrendPoint(
        date: today.addDays(-daysAgo),
        levelKg: daysAgo >= days
            ? fromKg
            : fromKg + (toKg - fromKg) * (days - daysAgo) / days,
        slopeKgPerDay: 0,
        waterKg: 0,
        levelVariance: 0.04,
        slopeVariance: 0.0001,
        observed: true,
        rejected: false,
      ),
  ];

  /// Weekly waist entries over [days], from [fromCm] to [toCm].
  List<WaistObservation> waistOver(
    double fromCm,
    double toCm, {
    int days = 84,
  }) => [
    for (var d = days; d >= 0; d -= 7)
      WaistObservation(
        date: today.addDays(-d),
        waistCm: fromCm + (toCm - fromCm) * (days - d) / days,
      ),
  ];

  /// A lift trained weekly for [days], from [fromKg] to [toKg].
  StrengthTrend lift(
    String name,
    double fromKg,
    double toKg, {
    int days = 84,
    int lastDaysAgo = 0,
    int everyDays = 7,
  }) => StrengthTrend(
    exercise: Exercise(
      id: name,
      name: name,
      equipment: squat.equipment,
      primary: squat.primary,
    ),
    exerciseId: name,
    loggedSessions: days ~/ everyDays + 1,
    recentSessions: days ~/ everyDays + 1,
    points: [
      for (var d = days; d >= lastDaysAgo; d -= everyDays)
        StrengthPoint(
          workoutId: d + 1,
          date: today.addDays(-d),
          estimateKg: fromKg + (toKg - fromKg) * (days - d) / days,
          trendKg: fromKg + (toKg - fromKg) * (days - d) / days,
        ),
    ],
  );

  List<StrengthTrend> lifts(double percent, {int days = 84}) => [
    lift('Back squat', 100, 100 * (1 + percent / 100), days: days),
    lift('Barbell row', 60, 60 * (1 + percent / 100), days: days),
  ];

  RecompReview? review({
    int days = 84,
    List<TargetsRecord>? history,
    List<WeightTrendPoint>? trendPoints,
    List<WaistObservation>? waist,
    List<StrengthTrend>? strength,
    ModeRecommendation recommendation = eligible,
  }) => recompReviewOf(
    history: history ?? onRecompFor(days),
    trend: trendPoints ?? trend(82, 81.6, days: days),
    waist: waist ?? waistOver(92, 89, days: days),
    strengthTrends: strength ?? lifts(6, days: days),
    recommendation: recommendation,
    today: today,
  );

  group('when a review is due', () {
    test('not before eight weeks on recomp', () {
      expect(review(days: 55), isNull);
    });

    test('at eight weeks, for two weeks', () {
      expect(review(days: 56)!.week, 8);
      expect(review(days: 69)!.week, 8);
      expect(review(days: 70), isNull);
    });

    test('at twelve weeks, then every eight', () {
      expect(review(days: 84)!.week, 12);
      expect(review(days: 98), isNull);
      expect(review(days: 140)!.week, 20);
      expect(review(days: 196)!.week, 28);
    });

    test('not on another goal', () {
      expect(
        review(history: [record(84), record(0, GoalMode.fatLoss)]),
        isNull,
      );
      expect(review(history: const []), isNull);
    });

    test('the weeks count from the last change to recomp', () {
      final history = [
        record(200),
        record(100, GoalMode.fatLoss),
        ...onRecompFor(56),
      ];
      expect(review(history: history, days: 56)!.week, 8);
    });

    test('it looks at twelve weeks at most', () {
      expect(review(days: 84)!.periodDays, 84);
      expect(review(days: 60)!.periodDays, 60);
      expect(review(days: 140)!.periodDays, 84);
    });
  });

  group('the verdict', () {
    test('waist down and two lifts up: working, with the three facts', () {
      final r = review()!;
      expect(r.verdict, RecompVerdict.working);
      expect(r.missing, isEmpty);
      expect(r.waist, MeasuredChange.down);
      expect(r.waistChangeCm, closeTo(-2.625, 1e-9));
      expect(r.strength, MeasuredChange.up);
      expect(r.liftsUp, ['Back squat', 'Barbell row']);
      expect(r.weightChangeFraction, closeTo(-0.4 / 82, 1e-9));
      expect(r.nextGoal, isNull);
    });

    test('waist down and strength held is working too', () {
      expect(review(strength: lifts(1))!.verdict, RecompVerdict.working);
    });

    test('weight down 3% with strength held: a slow cut', () {
      final r = review(trendPoints: trend(82, 79.5), strength: lifts(0))!;
      expect(r.verdict, RecompVerdict.slowCut);
      expect(r.nextGoal, GoalMode.fatLoss);
    });

    test('a slow cut suggests no deficit to someone not allowed one', () {
      final r = review(
        trendPoints: trend(82, 79.5),
        recommendation: const ModeRecommendation(
          GoalMode.maintenance,
          ModeReason.deficitNotAllowed,
        ),
      )!;
      expect(r.verdict, RecompVerdict.slowCut);
      expect(r.nextGoal, isNull);
    });

    test('no clear change in waist, strength up: probably working', () {
      final r = review(waist: waistOver(92, 91.5))!;
      expect(r.waist, MeasuredChange.noClearChange);
      expect(r.verdict, RecompVerdict.probablyWorking);
    });

    test('nothing moved at twelve weeks: not working, with a next goal', () {
      final r = review(
        trendPoints: trend(82, 82),
        waist: waistOver(92, 91.5),
        strength: lifts(0),
        recommendation: cutFirst,
      )!;
      expect(r.verdict, RecompVerdict.notWorking);
      expect(r.nextGoal, GoalMode.fatLoss);
    });

    test('not working, where recomp is still what fits: no other goal', () {
      final r = review(
        trendPoints: trend(82, 82),
        waist: waistOver(92, 91.5),
        strength: lifts(0),
      )!;
      expect(r.verdict, RecompVerdict.notWorking);
      expect(r.nextGoal, isNull);
    });

    test('the same at eight weeks is too early to tell', () {
      final r = review(
        days: 56,
        trendPoints: trend(82, 82, days: 56),
        waist: waistOver(92, 91.5, days: 56),
        strength: lifts(0, days: 56),
      )!;
      expect(r.verdict, RecompVerdict.tooEarly);
      expect(r.nextGoal, isNull);
    });

    test('unless lean and trained, where it is said at eight weeks', () {
      final r = review(
        days: 56,
        trendPoints: trend(82, 82, days: 56),
        waist: waistOver(92, 91.5, days: 56),
        strength: lifts(0, days: 56),
        recommendation: lean,
      )!;
      expect(r.verdict, RecompVerdict.notWorking);
      expect(r.nextGoal, GoalMode.leanGain);
    });

    test('a waist that went up, or strength that fell, is not working', () {
      expect(
        review(waist: waistOver(90, 93))!.verdict,
        RecompVerdict.notWorking,
      );
      final fell = review(strength: lifts(-6))!;
      expect(fell.strength, MeasuredChange.down);
      expect(fell.liftsDown, hasLength(2));
      expect(fell.verdict, RecompVerdict.notWorking);
    });
  });

  group('without enough logged there is no verdict', () {
    test('two waist measurements', () {
      final r = review(
        waist: [
          WaistObservation(date: today.addDays(-84), waistCm: 92),
          WaistObservation(date: today, waistCm: 89),
        ],
      )!;
      expect(r.verdict, isNull);
      expect(r.missing, [RecompMeasure.waist]);
      expect(r.waistMeasurements, 2);
    });

    test('no waist measurement lately', () {
      final r = review(
        waist: [
          for (final d in [84, 77, 70, 63])
            WaistObservation(date: today.addDays(-d), waistCm: 92),
        ],
      )!;
      expect(r.missing, [RecompMeasure.waist]);
    });

    test('one lift, or lifts trained in too few weeks', () {
      expect(review(strength: [lift('Back squat', 100, 106)])!.missing, [
        RecompMeasure.strength,
      ]);
      expect(
        review(
          strength: [
            lift('Back squat', 100, 106, everyDays: 21),
            lift('Barbell row', 60, 63, everyDays: 21),
          ],
        )!.missing,
        [RecompMeasure.strength],
      );
      expect(review(strength: const [])!.missing, [RecompMeasure.strength]);
    });

    test('lifts not trained in the last two weeks', () {
      expect(
        review(
          strength: [
            lift('Back squat', 100, 106, lastDaysAgo: 21),
            lift('Barbell row', 60, 63, lastDaysAgo: 21),
          ],
        )!.missing,
        [RecompMeasure.strength],
      );
    });

    test('no weight trend that far back', () {
      final r = review(trendPoints: trend(82, 82).sublist(100))!;
      expect(r.missing, [RecompMeasure.weight]);
    });

    test('everything missing is listed', () {
      final r = review(
        trendPoints: const [],
        waist: const [],
        strength: const [],
      )!;
      expect(r.missing, RecompMeasure.values);
      expect(r.verdict, isNull);
    });
  });
}
