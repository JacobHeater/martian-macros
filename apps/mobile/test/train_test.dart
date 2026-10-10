import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-75 and MM-76: logging a workout set by set, and choosing its exercises.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  Future<void> setUpUser(UnitSystem units) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-40)).copyWith(unitSystem: units),
    );
    await repos.weights.saveWeight(today, 82);
  }

  setUp(() => setUpUser(UnitSystem.metric));

  Workout finished(int daysAgo, List<WorkoutExercise> exercises) {
    final startedAt = DateTime(
      2026,
      10,
      5,
      18,
    ).subtract(Duration(days: daysAgo));
    return Workout(
      id: 0,
      date: today.addDays(-daysAgo),
      startedAt: startedAt,
      endedAt: startedAt.add(const Duration(minutes: 50)),
      exercises: exercises,
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

  Future<void> tapRir(WidgetTester tester, String key, String label) async {
    final finder = find.descendant(
      of: find.byKey(ValueKey(key)),
      matching: find.text(label),
    );
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  Future<void> openTrain(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Train'));
    await tester.pumpAndSettle();
  }

  /// Picks an exercise in the picker by searching for [query].
  Future<void> choose(
    WidgetTester tester,
    String query,
    String exerciseId,
  ) async {
    await tap(tester, 'workout-add-exercise');
    await tester.enterText(
      find.byKey(const ValueKey('exercise-search')),
      query,
    );
    await tester.pumpAndSettle();
    await tap(tester, 'exercise-$exerciseId');
  }

  Future<void> type(WidgetTester tester, String key, String value) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.enterText(finder, value);
    await tester.pumpAndSettle();
  }

  testWidgets('Train is a destination, empty until something is logged', (
    tester,
  ) async {
    await openTrain(tester);
    expect(find.byKey(const ValueKey('train-start')), findsOneWidget);
    expect(find.byKey(const ValueKey('train-repeat')), findsNothing);
    expect(find.byKey(const ValueKey('train-history')), findsNothing);
  });

  testWidgets('the next set is a copy of the last, in one tap', (tester) async {
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'back squat', 'back-squat');

    await tap(tester, 'add-set-0');
    await type(tester, 'set-0-0-reps', '8');
    await type(tester, 'set-0-0-load', '100');

    await tap(tester, 'add-set-0');

    final sets = (await stored(tester)).single.exercises.single.sets;
    expect([for (final s in sets) s.reps], [8, 8]);
    expect([for (final s in sets) s.loadKg], [100, 100]);
    // The first set is back to a line; the new one is open to adjust.
    expect(find.text('8 × 100 kg'), findsOneWidget);
    expect(find.byKey(const ValueKey('set-0-1-reps')), findsOneWidget);
  });

  testWidgets('reps and load step with the buttons, and RIR is optional', (
    tester,
  ) async {
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'back squat', 'back-squat');
    await tap(tester, 'add-set-0');
    await type(tester, 'set-0-0-reps', '8');
    await type(tester, 'set-0-0-load', '100');

    await tap(tester, 'set-0-0-reps-minus');
    await tap(tester, 'set-0-0-load-plus');
    await tap(tester, 'set-0-0-load-plus');
    var set = (await stored(tester)).single.exercises.single.sets.single;
    expect(set.reps, 7);
    expect(set.loadKg, 105);
    expect(set.rir, isNull);

    await tapRir(tester, 'set-0-0-rir', '2');
    set = (await stored(tester)).single.exercises.single.sets.single;
    expect(set.rir, 2);

    // Tapping the chosen one again clears it.
    await tapRir(tester, 'set-0-0-rir', '2');
    set = (await stored(tester)).single.exercises.single.sets.single;
    expect(set.rir, isNull);
  });

  testWidgets('two quick changes to a set are both kept', (tester) async {
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'back squat', 'back-squat');
    await tap(tester, 'add-set-0');
    await type(tester, 'set-0-0-reps', '8');
    await type(tester, 'set-0-0-load', '100');
    await tester.ensureVisible(find.byKey(const ValueKey('set-0-0-rir')));
    await tester.pumpAndSettle();

    // No frame between the taps: the second must not start from a set that
    // has not heard of the first.
    await tester.tap(find.byKey(const ValueKey('set-0-0-reps-plus')));
    await tester.tap(find.byKey(const ValueKey('set-0-0-load-plus')));
    await tester.tap(
      find.descendant(
        of: find.byKey(const ValueKey('set-0-0-rir')),
        matching: find.text('1'),
      ),
    );
    await tester.pumpAndSettle();

    final set = (await stored(tester)).single.exercises.single.sets.single;
    expect(set.reps, 9);
    expect(set.loadKg, 102.5);
    expect(set.rir, 1);
  });

  testWidgets('a load is never stepped below zero for a weighted exercise', (
    tester,
  ) async {
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'back squat', 'back-squat');
    await tap(tester, 'add-set-0');
    await tap(tester, 'set-0-0-load-minus');
    expect(
      (await stored(tester)).single.exercises.single.sets.single.loadKg,
      0,
    );
  });

  testWidgets('assisted bodyweight work is a load below zero', (tester) async {
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'pull', 'pull-up');
    await tap(tester, 'add-set-0');
    await type(tester, 'set-0-0-reps', '6');
    await tap(tester, 'set-0-0-load-minus');
    await tap(tester, 'set-0-0-load-minus');
    final set = (await stored(tester)).single.exercises.single.sets.single;
    expect(set.loadKg, -5);
    await tap(tester, 'add-set-0');
    expect(find.text('6 × 5 kg assisted'), findsOneWidget);
  });

  testWidgets('last time is shown beside today, and starts the first set', (
    tester,
  ) async {
    await repos.workouts.saveWorkout(
      finished(7, const [
        WorkoutExercise(
          exerciseId: 'back-squat',
          sets: [
            WorkoutSet(reps: 8, loadKg: 100, rir: 2),
            WorkoutSet(reps: 7, loadKg: 100),
          ],
        ),
      ]),
    );
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'back squat', 'back-squat');

    expect(
      find.text('Last time: 8 × 100 kg · 2 RIR, 7 × 100 kg'),
      findsOneWidget,
    );

    await tap(tester, 'add-set-0');
    final workouts = await stored(tester);
    final set = workouts.first.exercises.single.sets.single;
    expect(set.reps, 8);
    expect(set.loadKg, 100);
    expect(set.rir, isNull, reason: 'RIR is a judgment of one set');
  });

  testWidgets('pounds are entered and shown, kilograms are stored', (
    tester,
  ) async {
    await setUpUser(UnitSystem.imperial);
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'back squat', 'back-squat');
    await tap(tester, 'add-set-0');
    await type(tester, 'set-0-0-reps', '5');
    await type(tester, 'set-0-0-load', '225');

    final set = (await stored(tester)).single.exercises.single.sets.single;
    expect(set.loadKg, closeTo(102.1, 0.05));

    await tap(tester, 'add-set-0');
    expect(find.text('5 × 225 lb'), findsOneWidget);
  });

  testWidgets('a workout in progress survives the app closing', (tester) async {
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'back squat', 'back-squat');
    await tap(tester, 'add-set-0');
    await type(tester, 'set-0-0-reps', '8');
    await type(tester, 'set-0-0-load', '100');

    // Close the app and open it again on the same data.
    await tester.pumpWidget(const SizedBox());
    await tester.pumpAndSettle();
    await openTrain(tester);

    expect(find.byKey(const ValueKey('train-in-progress')), findsOneWidget);
    expect(find.byKey(const ValueKey('train-start')), findsNothing);
    await tap(tester, 'train-continue');
    expect(find.text('Back squat'), findsOneWidget);
    expect(find.text('8 × 100 kg'), findsOneWidget);
  });

  testWidgets('finishing lists the workout, which can be reopened', (
    tester,
  ) async {
    await openTrain(tester);
    await tap(tester, 'train-start');

    FilledButton finish() => tester.widget<FilledButton>(
      find.descendant(
        of: find.byKey(const ValueKey('workout-finish')),
        matching: find.byType(FilledButton),
      ),
    );
    expect(finish().onPressed, isNull, reason: 'nothing logged yet');

    await choose(tester, 'back squat', 'back-squat');
    await tap(tester, 'add-set-0');
    await type(tester, 'set-0-0-reps', '8');
    await tap(tester, 'workout-finish');

    final workout = (await stored(tester)).single;
    expect(workout.inProgress, isFalse);
    expect(workout.date, today);

    expect(find.byKey(const ValueKey('train-start')), findsOneWidget);
    expect(find.byKey(const ValueKey('train-repeat')), findsOneWidget);
    expect(find.text('1 exercise · 1 set · 0 min'), findsOneWidget);

    await tap(tester, 'workout-${workout.id}');
    expect(find.text('Back squat'), findsOneWidget);
    expect(find.byKey(const ValueKey('workout-finish')), findsNothing);
  });

  testWidgets('repeating the last workout starts with its exercises', (
    tester,
  ) async {
    await repos.workouts.saveWorkout(
      finished(2, const [
        WorkoutExercise(
          exerciseId: 'back-squat',
          sets: [WorkoutSet(reps: 8, loadKg: 100)],
        ),
        WorkoutExercise(
          exerciseId: 'leg-press',
          sets: [WorkoutSet(reps: 12, loadKg: 180)],
        ),
      ]),
    );
    await openTrain(tester);
    await tap(tester, 'train-repeat');

    final started = (await stored(tester)).first;
    expect(started.inProgress, isTrue);
    expect(
      [for (final e in started.exercises) e.exerciseId],
      ['back-squat', 'leg-press'],
    );
    expect(started.setCount, 0);
    expect(find.text('Back squat'), findsOneWidget);
    expect(find.text('Last time: 8 × 100 kg'), findsOneWidget);
  });

  testWidgets('a set and an exercise can be removed, and a workout deleted', (
    tester,
  ) async {
    await openTrain(tester);
    await tap(tester, 'train-start');
    await choose(tester, 'back squat', 'back-squat');
    await tap(tester, 'add-set-0');
    await tap(tester, 'add-set-0');
    await tap(tester, 'set-0-1-remove');
    expect((await stored(tester)).single.setCount, 1);

    await tap(tester, 'remove-exercise-0');
    // It has a set, so the app asks first.
    await tester.tap(find.text('Remove'));
    await tester.pumpAndSettle();
    expect((await stored(tester)).single.exercises, isEmpty);

    await tap(tester, 'workout-delete');
    await tester.tap(find.text('Delete'));
    await tester.pumpAndSettle();
    expect(await stored(tester), isEmpty);
    expect(find.byKey(const ValueKey('train-start')), findsOneWidget);
  });

  group('choosing an exercise', () {
    testWidgets('"bench" finds the bench presses', (tester) async {
      await openTrain(tester);
      await tap(tester, 'train-start');
      await tap(tester, 'workout-add-exercise');
      await tester.enterText(
        find.byKey(const ValueKey('exercise-search')),
        'bench',
      );
      await tester.pumpAndSettle();
      for (final name in [
        'Barbell bench press',
        'Dumbbell bench press',
        'Incline barbell bench press',
      ]) {
        expect(find.text(name), findsOneWidget);
      }
      expect(find.text('Back squat'), findsNothing);
    });

    testWidgets('recently used exercises come first, before any search', (
      tester,
    ) async {
      await repos.workouts.saveWorkout(
        finished(3, const [
          WorkoutExercise(
            exerciseId: 'walking-lunge',
            sets: [WorkoutSet(reps: 10, loadKg: 20)],
          ),
        ]),
      );
      await openTrain(tester);
      await tap(tester, 'train-start');
      await tap(tester, 'workout-add-exercise');

      expect(find.text('Recent'), findsOneWidget);
      final recent = tester.getTopLeft(find.text('Walking lunge')).dy;
      final heading = tester.getTopLeft(find.text('All exercises')).dy;
      expect(recent, lessThan(heading));
    });

    testWidgets('an exercise of your own is created, chosen and kept', (
      tester,
    ) async {
      await openTrain(tester);
      await tap(tester, 'train-start');
      await tap(tester, 'workout-add-exercise');
      await tester.enterText(
        find.byKey(const ValueKey('exercise-search')),
        'Landmine press',
      );
      await tester.pumpAndSettle();
      expect(find.text('No exercise by that name.'), findsOneWidget);

      await tap(tester, 'exercise-create');
      // The name typed in the search is carried over.
      expect(find.text('Landmine press'), findsOneWidget);
      await tap(tester, 'custom-exercise-primary');
      await tester.tap(find.text('Shoulders').last);
      await tester.pumpAndSettle();
      await tap(tester, 'custom-exercise-also-triceps');
      await tap(tester, 'custom-exercise-save');

      final custom = (await readNow(
        tester,
        () => repos.customExercises.watchCustomExercises().first,
      )).single;
      expect(custom.name, 'Landmine press');
      expect(custom.primary, MuscleGroup.shoulders);
      expect(custom.secondary, [MuscleGroup.triceps]);

      // It was added to the workout, and can be logged against.
      final workout = (await stored(tester)).single;
      expect(workout.exercises.single.exerciseId, custom.id);
      expect(find.text('Landmine press'), findsOneWidget);
      await tap(tester, 'add-set-0');
      expect((await stored(tester)).single.setCount, 1);
    });
  });
}
