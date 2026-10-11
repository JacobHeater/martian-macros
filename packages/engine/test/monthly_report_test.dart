import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-33: a monthly report, honest about thin data.
void main() {
  final start = CalendarDate(2026, 1, 1);
  final month = ReportPeriod(index: 0, from: start);

  IntakeDay ate(int day, {double protein = 150, double kcal = 2100}) =>
      IntakeDay(
        date: start.addDays(day),
        kcal: kcal,
        proteinG: protein,
        carbsG: 200,
        fatG: 70,
        completeness: DayCompleteness.complete,
      );

  WeightObservation weighed(int day, double kg) =>
      WeightObservation(date: start.addDays(day), weightKg: kg);

  WeightTrendPoint point(int day, double kg) => WeightTrendPoint(
    date: start.addDays(day),
    levelKg: kg,
    slopeKgPerDay: 0,
    waterKg: 0,
    levelVariance: 0.1,
    slopeVariance: 0.001,
    observed: true,
    rejected: false,
  );

  TargetsRecord record(
    int day, {
    double kcal = 2100,
    double tdee = 2700,
    TdeeStatus status = TdeeStatus.updated,
    double previous = 2200,
    ExplanationReason reason = ExplanationReason.expenditureEstimate,
  }) => TargetsRecord(
    effectiveFrom: start.addDays(day),
    mode: GoalMode.fatLoss,
    tdeeKcal: tdee,
    tdeeSigmaKcal: 180,
    tdeeStatus: status,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: 160,
      fatG: 70,
      carbsG: 200,
      weeklyRateFraction: -0.0075,
    ),
    explanation: TargetsExplanation(
      lines: [ExplanationLine(reason, kcal - previous)],
      previousKcal: previous,
      newKcal: kcal,
      estimateStatus: status,
    ),
  );

  MonthlyReport report({
    List<IntakeDay>? intake,
    List<WeightObservation>? weights,
    List<WaistObservation> waist = const [],
    List<TargetsRecord>? history,
    List<WeightTrendPoint>? trend,
  }) => buildMonthlyReport(
    period: month,
    intake: intake ?? [for (var d = 0; d < 28; d++) ate(d)],
    weights: weights ?? [for (var d = 0; d < 28; d += 2) weighed(d, 90)],
    waist: waist,
    history: history ?? [record(14)],
    trend: trend ?? [for (var d = 0; d < 28; d++) point(d, 90 - d * 0.04)],
  );

  group('which reports exist', () {
    test('the first is ready the day after day 28', () {
      expect(
        reportPeriods(onboardedOn: start, today: start.addDays(27)),
        isEmpty,
      );
      final ready = reportPeriods(onboardedOn: start, today: start.addDays(28));
      expect(ready.single.from, start);
      expect(ready.single.to, start.addDays(27));
    });

    test('then one every 28 days, oldest first', () {
      final ready = reportPeriods(onboardedOn: start, today: start.addDays(83));
      expect([for (final p in ready) p.index], [0, 1]);
      expect(ready.last.from, start.addDays(28));
    });
  });

  group('what the month holds', () {
    test('days logged, whole days and weigh-ins', () {
      final r = report(
        intake: [
          for (var d = 0; d < 20; d++) ate(d),
          for (var d = 20; d < 24; d++)
            IntakeDay(
              date: start.addDays(d),
              kcal: 400,
              proteinG: 20,
              carbsG: 40,
              fatG: 10,
              completeness: DayCompleteness.partial,
            ),
        ],
      );
      expect(r.daysLogged, 24);
      expect(r.completeDays, 20);
      expect(r.weighIns, 14);
    });

    test('days outside the month are not counted', () {
      final r = report(
        intake: [ate(-3), for (var d = 0; d < 28; d++) ate(d), ate(30)],
        weights: [weighed(-2, 91), weighed(0, 90), weighed(40, 85)],
      );
      expect(r.daysLogged, 28);
      expect(r.weighIns, 1);
    });

    test('trend change against the intended pace', () {
      final r = report();
      expect(r.trendChangeKg, closeTo(-27 * 0.04, 1e-9));
      // -0.75% a week of about 88.9 kg for four weeks.
      expect(r.intendedChangeKg, closeTo(-0.0075 * (90 - 27 * 0.04) * 4, 1e-6));
    });

    test('too few weigh-ins cannot say how the trend moved', () {
      final r = report(weights: [weighed(0, 90), weighed(10, 89)]);
      expect(r.trendChangeKg, isNull);
    });

    test('average protein against the target', () {
      final r = report(
        intake: [
          for (var d = 0; d < 14; d++) ate(d, protein: 120),
          for (var d = 14; d < 28; d++) ate(d, protein: 160),
        ],
      );
      expect(r.averageProteinG, closeTo(140, 1e-9));
      expect(r.averageProteinTargetG, 160);
    });

    test('waist change needs two measurements', () {
      expect(
        report(waist: [WaistObservation(date: start.addDays(3), waistCm: 100)])
            .waistFromCm,
        isNull,
      );
      final r = report(
        waist: [
          WaistObservation(date: start.addDays(2), waistCm: 100),
          WaistObservation(date: start.addDays(26), waistCm: 97.5),
        ],
      );
      expect(r.waistFromCm, 100);
      expect(r.waistToCm, 97.5);
    });
  });

  group('the expenditure estimate', () {
    test('is shown with its uncertainty when the month supports it', () {
      final r = report();
      expect(r.estimate!.kcal, 2700);
      expect(r.estimate!.sigmaKcal, 180);
      expect(r.estimateGap, isNull);
    });

    test('six logged days: says it could not be measured, and why', () {
      final r = report(intake: [for (var d = 0; d < 6; d++) ate(d)]);
      expect(r.estimate, isNull);
      expect(r.estimateGap, ReportEstimateGap.tooFewFoodDays);
    });

    test('enough food but never settled', () {
      final r = report(history: [record(14, status: TdeeStatus.held)]);
      expect(r.estimate, isNull);
      expect(r.estimateGap, ReportEstimateGap.notSettled);
    });

    test('uses the latest settled estimate of the month', () {
      final r = report(
        history: [record(7, tdee: 2600), record(21, tdee: 2750)],
      );
      expect(r.estimate!.kcal, 2750);
    });
  });

  group('changes to the targets', () {
    test('both are listed, each with the estimate it rested on', () {
      final r = report(
        history: [
          record(
            7,
            kcal: 2150,
            previous: 2200,
            tdee: 2650,
            reason: ExplanationReason.paceAndWeight,
          ),
          record(21, kcal: 2050, previous: 2150, tdee: 2600),
        ],
      );
      expect(r.targetChanges, hasLength(2));
      expect(r.targetChanges.first.previousKcal, 2200);
      expect(r.targetChanges.first.newKcal, 2150);
      expect(r.targetChanges.first.tdeeKcal, 2650);
      expect(r.targetChanges.last.tdeeKcal, 2600);
      expect(
        r.targetChanges.first.lines.single.reason,
        ExplanationReason.paceAndWeight,
      );
    });

    test('changes outside the month are not in it', () {
      final r = report(history: [record(-10), record(14), record(40)]);
      expect(r.targetChanges, hasLength(1));
    });

    test('a month with no change lists none', () {
      expect(report(history: const []).targetChanges, isEmpty);
    });
  });

  group('strength', () {
    final squat = builtInExercises.firstWhere((e) => e.id == 'back-squat');
    final row = builtInExercises.firstWhere((e) => e.id == 'barbell-row');
    var nextId = 1;

    /// A finished workout on [day] of the month: exercise id to load, each
    /// for one set of six.
    Workout trained(int day, Map<String, double> loads, {bool done = true}) {
      final date = start.addDays(day);
      final began = DateTime(date.year, date.month, date.day, 18);
      return Workout(
        id: nextId++,
        date: date,
        startedAt: began,
        endedAt: done ? began.add(const Duration(minutes: 50)) : null,
        exercises: [
          for (final entry in loads.entries)
            WorkoutExercise(
              exerciseId: entry.key,
              sets: [WorkoutSet(reps: 6, loadKg: entry.value)],
            ),
        ],
      );
    }

    MonthlyReport withWorkouts(List<Workout> workouts) => buildMonthlyReport(
      period: month,
      intake: [for (var d = 0; d < 28; d++) ate(d)],
      weights: [for (var d = 0; d < 28; d += 2) weighed(d, 90)],
      waist: const [],
      history: [record(14)],
      trend: [for (var d = 0; d < 28; d++) point(d, 90)],
      workouts: workouts,
      exercises: [squat, row],
    );

    test('a month with no training has no workouts and no lifts', () {
      final r = report();
      expect(r.workouts, 0);
      expect(r.lifts, isEmpty);
    });

    test('each lift goes from its first to its last session of the month', () {
      final r = withWorkouts([
        trained(1, {squat.id: 100, row.id: 60}),
        trained(8, {squat.id: 102.5, row.id: 60}),
        trained(15, {squat.id: 105}),
        trained(22, {squat.id: 107.5}),
      ]);
      expect(r.workouts, 4);
      expect(r.lifts.map((l) => l.name), [squat.name, row.name]);
      final first = r.lifts.first;
      expect(first.sessions, 4);
      expect(first.toKg, greaterThan(first.fromKg));
      // The first session of the month stands for itself: nothing before
      // it to smooth with.
      expect(
        first.fromKg,
        closeTo(
          estimatedOneRepMax(
            const WorkoutSet(reps: 6, loadKg: 100),
            load: squat.load,
            bodyweightKg: null,
          )!,
          1e-9,
        ),
      );
      expect(r.lifts.last.toKg, closeTo(r.lifts.last.fromKg, 1e-9));
    });

    test('a lift done once in the month is not listed: one session shows '
        'no change', () {
      final r = withWorkouts([
        trained(1, {squat.id: 100, row.id: 60}),
        trained(8, {squat.id: 102.5}),
      ]);
      expect(r.lifts.map((l) => l.name), [squat.name]);
    });

    test('sessions outside the month, and unfinished ones, do not count', () {
      final r = withWorkouts([
        trained(-7, {squat.id: 95}),
        trained(1, {squat.id: 100}),
        trained(20, {squat.id: 110}, done: false),
        trained(35, {squat.id: 120}),
      ]);
      expect(r.workouts, 1);
      expect(r.lifts, isEmpty);
    });

    test('a later session does not change what an old report says', () {
      final inMonth = [
        trained(1, {squat.id: 100}),
        trained(22, {squat.id: 105}),
      ];
      final then = withWorkouts(inMonth).lifts.single;
      final later = withWorkouts([
        ...inMonth,
        trained(40, {squat.id: 130}),
      ]).lifts.single;
      expect(later.fromKg, then.fromKg);
      expect(later.toKg, then.toKg);
    });
  });

  group('the recomp review', () {
    const eligible = ModeRecommendation(
      GoalMode.recomp,
      ModeReason.recompEligible,
    );

    TargetsRecord onRecomp(int day, [GoalMode mode = GoalMode.recomp]) =>
        TargetsRecord(
          effectiveFrom: start.addDays(day),
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

    /// The report of the month that begins [monthStart] days after recomp
    /// began on day 0, with waist measured weekly throughout.
    MonthlyReport reportFrom(
      int monthStart, {
      ModeRecommendation? recommendation = eligible,
      GoalMode mode = GoalMode.recomp,
    }) => buildMonthlyReport(
      period: ReportPeriod(index: 0, from: start.addDays(monthStart)),
      intake: const [],
      weights: const [],
      waist: [
        for (var d = 0; d <= 140; d += 7)
          WaistObservation(date: start.addDays(d), waistCm: 92 - d * 0.04),
      ],
      history: [onRecomp(0, mode)],
      trend: [for (var d = 0; d <= 140; d++) point(d, 82)],
      recommendation: recommendation,
    );

    test('a month in which none falls due has none', () {
      expect(reportFrom(0).recompReview, isNull);
      expect(reportFrom(100).recompReview, isNull);
    });

    test('the week 8 review is in the month it fell due in', () {
      // Days 42 to 69: the review is due on day 56.
      final review = reportFrom(42).recompReview!;
      expect(review.week, 8);
      // Read on the last day it was shown in the month, day 69.
      expect(review.periodDays, 69);
      expect(review.waist, MeasuredChange.down);
      expect(review.missing, [RecompMeasure.strength]);
    });

    test('a review due in the month before is not repeated, and the next '
        'one due is shown', () {
      // Days 60 to 87: week 8 was already showing; week 12 is due on day 84.
      final review = reportFrom(60).recompReview!;
      expect(review.week, 12);
      // Days 57 to 84: week 8 fell due on day 56, the day before.
      expect(reportFrom(57).recompReview!.week, 12);
      // Days 56 to 83: week 8 falls due on the first day and week 12 the
      // day after the last.
      expect(reportFrom(56).recompReview!.week, 8);
    });

    test('there is none on another goal, or when no recommendation is '
        'given', () {
      expect(reportFrom(42, mode: GoalMode.fatLoss).recompReview, isNull);
      expect(reportFrom(42, recommendation: null).recompReview, isNull);
    });
  });
}
