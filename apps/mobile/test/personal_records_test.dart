import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-92: personal records, marked on the workout that set them.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-40))
          .copyWith(unitSystem: UnitSystem.metric),
    );
    await repos.weights.saveWeight(today, 82);
  });

  Future<int> did(int daysAgo, double squatKg, {int reps = 5}) {
    final date = today.addDays(-daysAgo);
    final start = DateTime(date.year, date.month, date.day, 18);
    return repos.workouts.saveWorkout(
      Workout(
        id: 0,
        date: date,
        startedAt: start,
        endedAt: start.add(const Duration(minutes: 50)),
        exercises: [
          WorkoutExercise(
            exerciseId: 'back-squat',
            sets: [WorkoutSet(reps: reps, loadKg: squatKg)],
          ),
        ],
      ),
    );
  }

  Future<void> tap(WidgetTester tester, String key) async {
    final finder = find.byKey(ValueKey(key));
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

  String subtitleOf(WidgetTester tester, int workoutId) => tester
      .widgetList<Text>(
        find.descendant(
          of: find.byKey(ValueKey('workout-$workoutId')),
          matching: find.byType(Text),
        ),
      )
      .map((t) => t.data ?? '')
      .join(' | ');

  testWidgets('a workout that beat the lift\'s best is marked, in the list '
      'and when opened', (tester) async {
    final first = await did(14, 100);
    final second = await did(7, 105);
    await openTrain(tester);

    expect(subtitleOf(tester, second), contains('1 personal record'));
    expect(subtitleOf(tester, first), isNot(contains('personal record')));

    await tap(tester, 'workout-$second');
    expect(find.byKey(const ValueKey('workout-records')), findsOneWidget);
    expect(find.text('Personal record'), findsOneWidget);
    // Five reps: the estimate is the load and a sixth more.
    expect(
      find.text('Back squat: estimated max 122.5 kg, up from 116.7 kg.'),
      findsOneWidget,
    );
  });

  testWidgets('a workout that matched it is not', (tester) async {
    await did(14, 100);
    final second = await did(7, 100);
    await openTrain(tester);

    expect(subtitleOf(tester, second), isNot(contains('personal record')));
    await tap(tester, 'workout-$second');
    expect(find.byKey(const ValueKey('workout-records')), findsNothing);
  });

  testWidgets('finishing a workout with a better set marks it', (tester) async {
    await did(7, 100);
    await openTrain(tester);
    await tap(tester, 'train-repeat');
    await tap(tester, 'add-set-0');
    await tap(tester, 'set-0-0-load-plus');
    await tester.dragUntilVisible(
      find.byKey(const ValueKey('workout-finish')),
      find.byType(ListView).last,
      const Offset(0, -200),
    );
    await tap(tester, 'workout-finish');

    final latest = await readNow(
      tester,
      () => repos.workouts.watchWorkouts().first,
    );
    expect(subtitleOf(tester, latest.first.id), contains('1 personal record'));
  });

  testWidgets('nothing about a record mentions body weight or eating', (
    tester,
  ) async {
    await did(14, 100);
    final second = await did(7, 105);
    await openTrain(tester);
    await tap(tester, 'workout-$second');

    final card = tester
        .widgetList<Text>(
          find.descendant(
            of: find.byKey(const ValueKey('workout-records')),
            matching: find.byType(Text),
          ),
        )
        .map((t) => (t.data ?? '').toLowerCase())
        .join(' ');
    for (final word in ['lowest', 'deficit', 'calorie', 'kcal', 'lost']) {
      expect(card, isNot(contains(word)), reason: word);
    }
  });
}
