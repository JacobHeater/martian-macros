import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  final today = CalendarDate(2026, 10, 11);
  final bench = builtInExercises.firstWhere(
    (e) => e.id == 'barbell-bench-press',
  );
  final pullUp = builtInExercises.firstWhere((e) => e.id == 'pull-up');
  Workout workout(
    int id,
    int daysAgo,
    List<WorkoutSet> sets, {
    String? exerciseId,
    bool finished = true,
  }) {
    final date = today.addDays(-daysAgo);
    final start = DateTime(date.year, date.month, date.day, 18);
    return Workout(
      id: id,
      date: date,
      startedAt: start,
      endedAt: finished ? start.add(const Duration(hours: 1)) : null,
      exercises: [
        WorkoutExercise(exerciseId: exerciseId ?? bench.id, sets: sets),
      ],
    );
  }

  WorkoutSet set(double load, {int reps = 6, int? rir}) =>
      WorkoutSet(reps: reps, loadKg: load, rir: rir);
  List<StrengthTrend> build(
    List<Workout> workouts, {
    List<WeightObservation> weights = const [],
  }) => buildStrengthTrends(
    workouts: workouts,
    exercises: [bench, pullUp],
    weights: weights,
    today: today,
  );

  test('MM-194 deleted exercise retains logged sessions without guessing resistance', () {
    final result = build([
      workout(1, 0, [set(100)], exerciseId: 'custom-deleted'),
    ]);
    expect(result, hasLength(1));
    expect(result.single.loggedSessions, 1);
    expect(result.single.points, isEmpty);
  });

  group('Epley e1RM', () {
    test('5 at 100 with 2 RIR is 123.3 kg, missing RIR is conservative', () {
      expect(
        estimatedOneRepMax(set(100, reps: 5, rir: 2), load: bench.load),
        closeTo(123.333333, 0.00001),
      );
      expect(
        estimatedOneRepMax(set(100, reps: 5), load: bench.load),
        closeTo(116.666667, 0.00001),
      );
    });
    test('effective 12 counts, 13 and RIR 5+ do not', () {
      expect(
        estimatedOneRepMax(set(100, reps: 10, rir: 2), load: bench.load),
        140,
      );
      expect(
        estimatedOneRepMax(set(100, reps: 11, rir: 2), load: bench.load),
        isNull,
      );
      expect(estimatedOneRepMax(set(100, reps: 20), load: bench.load), isNull);
      expect(
        estimatedOneRepMax(set(100, reps: 2, rir: 5), load: bench.load),
        isNull,
      );
    });
    test('zero resistance and unknown bodyweight are not zero strength', () {
      expect(estimatedOneRepMax(set(0), load: bench.load), isNull);
      expect(estimatedOneRepMax(set(10), load: pullUp.load), isNull);
      expect(
        estimatedOneRepMax(set(-80), load: pullUp.load, bodyweightKg: 80),
        isNull,
      );
      expect(
        estimatedOneRepMax(
          set(10, reps: 5, rir: 2),
          load: pullUp.load,
          bodyweightKg: 80,
        ),
        closeTo(111, 0.00001),
      );
      expect(
        estimatedOneRepMax(
          set(-20, reps: 5, rir: 2),
          load: pullUp.load,
          bodyweightKg: 80,
        ),
        closeTo(74, 0.00001),
      );
    });
    test('malformed inputs are explicit errors', () {
      for (final value in [
        set(double.nan),
        set(double.infinity),
        set(10, reps: 0),
        set(10, rir: -1),
        set(10, rir: 6),
      ]) {
        expect(
          () => estimatedOneRepMax(value, load: bench.load),
          throwsArgumentError,
        );
      }
      expect(
        () => estimatedOneRepMax(set(10), load: pullUp.load, bodyweightKg: -1),
        throwsArgumentError,
      );
    });
  });

  test('session best combines every occurrence of the lift', () {
    final session = workout(1, 0, [set(100), set(102.5), set(98)]).copyWith(
      exercises: [
        WorkoutExercise(exerciseId: bench.id, sets: [set(100), set(98)]),
        WorkoutExercise(exerciseId: bench.id, sets: [set(102.5)]),
      ],
    );
    final result = build([session]).single;
    expect(result.points.single.estimateKg, 123);
    expect(result.points.single.trendKg, 123);
    expect(result.loggedSessions, 1);
  });

  test('smoothing uses at most 3 sessions within 28 days; long gaps reset', () {
    final result = build([
      workout(5, 0, [set(120)]),
      workout(3, 35, [set(100)]),
      workout(1, 49, [set(100)]),
      workout(4, 28, [set(90)]),
      workout(2, 42, [set(110)]),
    ]).single;
    expect(result.points.map((p) => p.workoutId), [1, 2, 3, 4, 5]);
    expect(result.points.map((p) => p.trendKg), [120, 126, 124, 120, 126]);
    final afterGap = build([
      workout(1, 50, [set(100)]),
      workout(2, 0, [set(80)]),
    ]).single;
    expect(afterGap.points.last.trendKg, 96);
  });

  test('4 and 12 week changes use smoothed baselines, not guessed points', () {
    final points = [
      workout(1, 98, [set(100 / 1.2)]),
      workout(2, 91, [set(100 / 1.2)]),
      workout(3, 84, [set(100 / 1.2)]),
      workout(4, 42, [set(100 / 1.2)]),
      workout(5, 35, [set(100 / 1.2)]),
      workout(6, 28, [set(100 / 1.2)]),
      workout(7, 14, [set(106 / 1.2)]),
      workout(8, 7, [set(106 / 1.2)]),
      workout(9, 0, [set(106 / 1.2)]),
    ];
    final trend = build(points).single;
    expect(trend.changeOverDays(28), closeTo(6, 0.00001));
    expect(trend.changeOverDays(84), closeTo(6, 0.00001));
    expect(
      build([
        workout(1, 0, [set(100)]),
      ]).single.changeOverDays(28),
      isNull,
    );
    expect(
      build([
        workout(1, 36, [set(100)]),
        workout(2, 0, [set(100)]),
      ]).single.changeOverDays(28),
      isNull,
    );
    expect(
      build([
        workout(1, 35, [set(100)]),
        workout(2, 0, [set(100)]),
      ]).single.changeOverDays(28),
      closeTo(0, 0.00001),
    );
    expect(() => trend.changeOverDays(0), throwsArgumentError);
  });

  test('bodyweight uses only a recent historical reading and recomputes corrections', () {
    final sessions = [
      workout(1, 20, [set(10, reps: 5, rir: 2)], exerciseId: pullUp.id),
      workout(2, 0, [set(-20)], exerciseId: pullUp.id),
    ];
    var result = build(
      sessions,
      weights: [
        WeightObservation(date: today.addDays(-27), weightKg: 80),
        WeightObservation(date: today.addDays(-19), weightKg: 100),
      ],
    ).single;
    expect(result.points.single.estimateKg, closeTo(111, 0.00001));
    expect(result.loggedSessions, 2);
    result = build(
      sessions,
      weights: [
        WeightObservation(date: today.addDays(-20), weightKg: 90),
        WeightObservation(date: today, weightKg: 80),
      ],
    ).single;
    expect(result.points.first.estimateKg, closeTo(123.333333, 0.00001));
    expect(result.points.last.estimateKg, 72);
    expect(
      build(
        sessions,
        weights: [WeightObservation(date: today.addDays(-28), weightKg: 80)],
      ).single.points,
      isEmpty,
    );
  });

  test('in-progress/future/empty sessions do not count, unusable lifts stay accessible', () {
    final result = build([
      workout(1, 0, [set(100)], finished: false),
      workout(2, -1, [set(100)]),
      workout(3, 0, []),
      workout(4, 0, [set(100, reps: 20)]),
    ]).single;
    expect(result.points, isEmpty);
    expect(result.loggedSessions, 1);
    expect(result.recentSessions, 0);
  });

  test(
    'ranking is deterministic; duplicate dates retain separate sessions',
    () {
      final result = build(
        [
          workout(4, 0, [set(100)], exerciseId: pullUp.id),
          workout(2, 1, [set(100)], exerciseId: pullUp.id),
          workout(3, 0, [set(80)]),
          workout(1, 0, [set(100)]),
          workout(5, 90, [set(100)]),
        ],
        weights: [WeightObservation(date: today.addDays(-1), weightKg: 80)],
      );
      expect(result.map((r) => r.exerciseId), [bench.id, pullUp.id]);
      expect(result.first.recentSessions, 2);
      expect(result.first.points.map((p) => p.workoutId), [5, 1, 3]);
      expect(result.first.points.last.date, result.first.points[1].date);
      expect(build([]), isEmpty);
      expect(
        build([
          workout(1, 0, [set(100)]),
        ]).single.points.length,
        1,
      );
      expect(
        build([
          workout(1, 0, [set(80)]),
        ]).single.points.single.estimateKg,
        96,
      );
    },
  );
}
