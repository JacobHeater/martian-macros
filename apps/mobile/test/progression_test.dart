import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-79: a suggestion for what to lift next, shown on the exercise and
/// starting its first set.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  Future<void> setUpUser({
    GoalMode goal = GoalMode.leanGain,
    UnitSystem units = UnitSystem.metric,
  }) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        onboardedOn: today.addDays(-40),
        goalMode: goal,
      ).copyWith(unitSystem: units),
    );
    await repos.weights.saveWeight(today, 82);
  }

  setUp(setUpUser);

  /// A finished session of [exerciseId] [daysAgo]: sets of (reps, kg).
  Future<void> did(
    int daysAgo,
    List<(int, double)> sets, {
    String exerciseId = 'back-squat',
  }) async {
    final startedAt = DateTime(
      2026,
      10,
      5,
      18,
    ).subtract(Duration(days: daysAgo));
    await repos.workouts.saveWorkout(
      Workout(
        id: 0,
        date: today.addDays(-daysAgo),
        startedAt: startedAt,
        endedAt: startedAt.add(const Duration(minutes: 50)),
        exercises: [
          WorkoutExercise(
            exerciseId: exerciseId,
            sets: [
              for (final (reps, kg) in sets) WorkoutSet(reps: reps, loadKg: kg),
            ],
          ),
        ],
      ),
    );
  }

  Future<List<Workout>> stored(WidgetTester tester) =>
      readNow(tester, () => repos.workouts.watchWorkouts().first);

  Future<void> tap(WidgetTester tester, String key) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  /// A workout in progress with [exerciseId] added.
  Future<void> startWith(WidgetTester tester, String exerciseId) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Train'));
    await tester.pumpAndSettle();
    await tap(tester, 'train-start');
    await tap(tester, 'workout-add-exercise');
    await tap(tester, 'exercise-$exerciseId');
  }

  String suggestion(WidgetTester tester) =>
      tester.widget<Text>(find.byKey(const ValueKey('suggestion-0'))).data!;

  Future<WorkoutSet> firstSet(WidgetTester tester) async {
    await tap(tester, 'add-set-0');
    return (await stored(tester)).first.exercises.single.sets.single;
  }

  testWidgets('nothing is suggested for an exercise never done', (
    tester,
  ) async {
    await startWith(tester, 'back-squat');
    expect(find.byKey(const ValueKey('suggestion-0')), findsNothing);
    final set = await firstSet(tester);
    expect(set.reps, 0);
    expect(set.loadKg, 0);
  });

  testWidgets('short of the top of the range: the same load for more reps', (
    tester,
  ) async {
    await did(7, [(8, 60), (8, 60), (7, 60)]);
    await startWith(tester, 'back-squat');

    expect(
      suggestion(tester),
      'Last time 60 kg × 8, 8, 7. One more rep on any set would be a step up.',
    );
    final set = await firstSet(tester);
    expect(set.reps, 8);
    expect(set.loadKg, 60);
  });

  testWidgets('every set at the top: more load, at the bottom of the range', (
    tester,
  ) async {
    await did(7, [(10, 60), (10, 60), (10, 60)]);
    await startWith(tester, 'back-squat');

    expect(
      suggestion(tester),
      'Every set reached 10 last time. A step up would be 62.5 kg × 6.',
    );
    final set = await firstSet(tester);
    expect(set.reps, 6);
    expect(set.loadKg, 62.5);
  });

  testWidgets('the first set starts from the working sets, not a warm-up', (
    tester,
  ) async {
    await did(7, [(10, 20), (8, 60), (7, 60)]);
    await startWith(tester, 'back-squat');

    final set = await firstSet(tester);
    expect(set.reps, 8);
    expect(set.loadKg, 60);
  });

  testWidgets('the suggestion can be changed freely, and later sets copy the '
      'set before', (tester) async {
    await did(7, [(10, 60), (10, 60)]);
    await startWith(tester, 'back-squat');
    await tap(tester, 'add-set-0');
    await tap(tester, 'set-0-0-reps-plus');
    await tap(tester, 'add-set-0');

    final sets = (await stored(tester)).first.exercises.single.sets;
    expect(sets.map((s) => s.reps), [7, 7]);
    expect(sets.map((s) => s.loadKg), [62.5, 62.5]);
  });

  testWidgets('three sessions at one load without more reps: hold', (
    tester,
  ) async {
    await did(21, [(8, 60), (7, 60)]);
    await did(14, [(8, 60), (6, 60)]);
    await did(7, [(8, 60), (7, 60)]);
    await startWith(tester, 'back-squat');

    expect(
      suggestion(tester),
      'Last time 60 kg × 8, 7. No more reps at this load in three sessions. '
      'Holding 60 kg × 8 is a fair aim.',
    );
    final set = await firstSet(tester);
    expect(set.reps, 8);
    expect(set.loadKg, 60);
  });

  testWidgets('on a fat loss goal the suggestion is to match last time', (
    tester,
  ) async {
    await setUpUser(goal: GoalMode.fatLoss);
    await did(7, [(10, 60), (10, 60)]);
    await startWith(tester, 'back-squat');

    expect(
      suggestion(tester),
      'Last time 60 kg × 10, 10. '
      'Matching it holds your strength while you lose fat.',
    );
    final set = await firstSet(tester);
    expect(set.reps, 10);
    expect(set.loadKg, 60);
  });

  testWidgets('pounds step by a round number of pounds', (tester) async {
    await setUpUser(units: UnitSystem.imperial);
    final kg = Units.lbToKg(135);
    await did(7, [(10, kg), (10, kg)]);
    await startWith(tester, 'back-squat');

    expect(
      suggestion(tester),
      'Every set reached 10 last time. A step up would be 140 lb × 6.',
    );
    final set = await firstSet(tester);
    expect(Units.kgToLb(set.loadKg), closeTo(140, 1e-9));
  });

  testWidgets('the body alone: more reps, with no load to name', (
    tester,
  ) async {
    await did(7, [(14, 0), (12, 0)], exerciseId: 'pull-up');
    await startWith(tester, 'pull-up');

    expect(
      suggestion(tester),
      'Last time 14, 12 reps. One more rep on any set would be a step up.',
    );
  });

  testWidgets('assisted work steps toward less help', (tester) async {
    await did(7, [(12, -20), (12, -20)], exerciseId: 'pull-up');
    await startWith(tester, 'pull-up');

    expect(
      suggestion(tester),
      'Every set reached 12 last time. '
      'A step up would be 15 kg assisted × 8.',
    );
  });

  testWidgets('a finished workout shows no suggestion', (tester) async {
    await did(14, [(8, 60)]);
    await did(7, [(8, 60)]);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Train'));
    await tester.pumpAndSettle();
    final latest = (await stored(tester)).first;
    await tap(tester, 'workout-${latest.id}');

    expect(find.byKey(const ValueKey('exercise-0')), findsOneWidget);
    expect(find.byKey(const ValueKey('suggestion-0')), findsNothing);
  });
}
