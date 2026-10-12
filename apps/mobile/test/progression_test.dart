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

    expect(suggestion(tester), 'One more rep on any set would be a step up.');
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
      'No more reps at this load in three sessions. '
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
      'Matching last time holds your strength while you lose fat.',
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

    expect(suggestion(tester), 'One more rep on any set would be a step up.');
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

  group('a range and step of the user\'s own', () {
    Future<void> type(WidgetTester tester, String key, String value) async {
      await tester.enterText(find.byKey(ValueKey(key)), value);
      await tester.pumpAndSettle();
    }

    String settingsLine(WidgetTester tester) => tester
        .widgetList<Text>(
          find.descendant(
            of: find.byKey(const ValueKey('progression-0')),
            matching: find.byType(Text),
          ),
        )
        .map((t) => t.data ?? '')
        .join(' | ');

    Future<List<ExerciseProgression>> saved(WidgetTester tester) => readNow(
      tester,
      () => repos.exerciseProgressions.watchExerciseProgressions().first,
    );

    testWidgets('the exercise says what suggestions use, the defaults to '
        'begin with', (tester) async {
      await did(7, [(8, 60), (8, 60)]);
      await startWith(tester, 'back-squat');
      expect(settingsLine(tester), contains('6 to 10 reps · 2.5 kg steps'));
    });

    testWidgets('a range and a step can be set, and the suggestion follows', (
      tester,
    ) async {
      await did(7, [(5, 100), (5, 100)]);
      await startWith(tester, 'back-squat');
      expect(suggestion(tester), 'One more rep on any set would be a step up.');

      await tap(tester, 'progression-0');
      await type(tester, 'progression-low', '3');
      await type(tester, 'progression-high', '5');
      await type(tester, 'progression-step', '5');
      await tap(tester, 'progression-save');

      expect(await saved(tester), [
        const ExerciseProgression(
          exerciseId: 'back-squat',
          repsLow: 3,
          repsHigh: 5,
          loadStepKg: 5,
        ),
      ]);
      expect(settingsLine(tester), contains('3 to 5 reps · 5 kg steps'));
      expect(
        suggestion(tester),
        'Every set reached 5 last time. A step up would be 105 kg × 3.',
      );
      final set = await firstSet(tester);
      expect(set.reps, 3);
      expect(set.loadKg, 105);
    });

    testWidgets('an empty step keeps the usual one, and the screen opens on '
        'what is saved', (tester) async {
      await did(7, [(8, 60)]);
      await startWith(tester, 'back-squat');
      await tap(tester, 'progression-0');
      expect(
        find.textContaining('Leave empty for the usual step: 2.5 kg.'),
        findsOneWidget,
      );
      await type(tester, 'progression-low', '5');
      await type(tester, 'progression-high', '8');
      await tap(tester, 'progression-save');

      expect((await saved(tester)).single.loadStepKg, isNull);
      expect(settingsLine(tester), contains('5 to 8 reps · 2.5 kg steps'));

      await tap(tester, 'progression-0');
      final low = tester.widget<TextField>(
        find.descendant(
          of: find.byKey(const ValueKey('progression-low')),
          matching: find.byType(TextField),
        ),
      );
      expect(low.controller!.text, '5');
    });

    testWidgets('a range that is no range cannot be saved, and says why', (
      tester,
    ) async {
      await did(7, [(8, 60)]);
      await startWith(tester, 'back-squat');
      await tap(tester, 'progression-0');
      await type(tester, 'progression-low', '10');
      await type(tester, 'progression-high', '8');

      expect(
        find.text('The most reps has to be more than the fewest.'),
        findsOneWidget,
      );
      await tap(tester, 'progression-save');
      expect(await saved(tester), isEmpty);

      await type(tester, 'progression-high', '12');
      await type(tester, 'progression-step', '0');
      expect(
        find.text('The load step is a number above zero, or left empty.'),
        findsOneWidget,
      );
    });

    testWidgets('the defaults can be taken back', (tester) async {
      await repos.exerciseProgressions.saveExerciseProgression(
        const ExerciseProgression(
          exerciseId: 'back-squat',
          repsLow: 3,
          repsHigh: 5,
        ),
      );
      await did(7, [(8, 60)]);
      await startWith(tester, 'back-squat');
      expect(settingsLine(tester), contains('3 to 5 reps'));

      await tap(tester, 'progression-0');
      await tap(tester, 'progression-defaults');
      expect(await saved(tester), isEmpty);
      expect(settingsLine(tester), contains('6 to 10 reps'));
    });

    testWidgets('pounds are typed for the step, kilograms are stored', (
      tester,
    ) async {
      await setUpUser(units: UnitSystem.imperial);
      await did(7, [(8, 60)]);
      await startWith(tester, 'back-squat');
      await tap(tester, 'progression-0');
      await type(tester, 'progression-step', '10');
      await tap(tester, 'progression-save');

      expect(
        Units.kgToLb((await saved(tester)).single.loadStepKg!),
        closeTo(10, 1e-9),
      );
      expect(settingsLine(tester), contains('10 lb steps'));
    });
  });
}
