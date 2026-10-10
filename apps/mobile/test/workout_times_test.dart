import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-191: a workout's times set by hand, its running clock, and the set and
/// rest timers.
void main() {
  final today = CalendarDate(2026, 10, 5);
  final noon = DateTime(2026, 10, 5, 12);
  late InMemoryRepositories repos;
  late FixedClock clock;

  setUp(() async {
    repos = InMemoryRepositories();
    clock = FixedClock(today);
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-40))
          .copyWith(unitSystem: UnitSystem.metric),
    );
    await repos.weights.saveWeight(today, 82);
  });

  Future<List<Workout>> stored(WidgetTester tester) =>
      readNow(tester, () => repos.workouts.watchWorkouts().first);

  Future<void> tap(WidgetTester tester, String key) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  String textOf(WidgetTester tester, String key) =>
      tester.widget<Text>(find.byKey(ValueKey(key))).data!;

  /// Lets [time] pass on the app's clock and the timers tick.
  Future<void> wait(WidgetTester tester, Duration time) async {
    clock.elapse(time);
    await tester.pump(const Duration(seconds: 1));
  }

  Future<void> openTrain(WidgetTester tester) async {
    await pumpApp(tester, repos, clock);
    await tester.tap(find.text('Train'));
    await tester.pumpAndSettle();
  }

  /// A workout in progress with a back squat in it.
  Future<void> startSquats(WidgetTester tester) async {
    await openTrain(tester);
    await tap(tester, 'train-start');
    await tap(tester, 'workout-add-exercise');
    await tap(tester, 'exercise-back-squat');
  }

  /// Types a time into the time picker and confirms it.
  Future<void> enterTime(
    WidgetTester tester,
    int hour,
    int minute, {
    bool am = false,
  }) async {
    await tester.tap(find.byTooltip('Switch to text input mode'));
    await tester.pumpAndSettle();
    final fields = find.descendant(
      of: find.byType(Dialog),
      matching: find.byType(TextField),
    );
    await tester.enterText(fields.at(0), '$hour');
    await tester.enterText(fields.at(1), minute.toString().padLeft(2, '0'));
    await tester.pumpAndSettle();
    if (am) {
      await tester.tap(find.text('AM'));
      await tester.pumpAndSettle();
    }
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
  }

  Future<int> saveFinished(WidgetTester tester) => repos.workouts.saveWorkout(
    Workout(
      id: 0,
      date: today.addDays(-1),
      startedAt: DateTime(2026, 10, 4, 18),
      endedAt: DateTime(2026, 10, 4, 18, 50),
      exercises: const [
        WorkoutExercise(
          exerciseId: 'back-squat',
          sets: [WorkoutSet(reps: 8, loadKg: 100)],
        ),
      ],
    ),
  );

  group('the workout clock', () {
    testWidgets('runs while a workout is in progress', (tester) async {
      await startSquats(tester);
      expect(textOf(tester, 'workout-elapsed'), '0:00');

      await wait(tester, const Duration(minutes: 12, seconds: 5));
      expect(textOf(tester, 'workout-elapsed'), '12:05');
      expect(find.text('Started 12:00 PM'), findsOneWidget);
    });

    testWidgets('can be started again from now', (tester) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 20));
      await tap(tester, 'workout-edit-times');
      await tap(tester, 'workout-restart-clock');

      final workout = (await stored(tester)).single;
      expect(workout.startedAt, noon.add(const Duration(minutes: 20)));
      expect(workout.inProgress, isTrue);
    });

    testWidgets('a finished workout shows when it was and how long', (
      tester,
    ) async {
      final id = await saveFinished(tester);
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      expect(textOf(tester, 'workout-elapsed'), '50:00');
      expect(textOf(tester, 'workout-span'), '6:00 PM to 6:50 PM');
      // Nothing to time in a finished workout.
      expect(find.byKey(const ValueKey('set-timer-button')), findsNothing);
    });
  });

  group('pausing the workout clock', () {
    testWidgets('stops it, and resuming carries on from where it was', (
      tester,
    ) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 10));
      await tap(tester, 'workout-pause');
      expect(textOf(tester, 'workout-clock-state'), 'Paused');

      await wait(tester, const Duration(minutes: 5));
      expect(textOf(tester, 'workout-elapsed'), '10:00');

      await tap(tester, 'workout-pause');
      expect(textOf(tester, 'workout-clock-state'), 'Started 12:00 PM');
      await wait(tester, const Duration(minutes: 2));
      expect(textOf(tester, 'workout-elapsed'), '12:00');

      final workout = (await stored(tester)).single;
      expect(workout.paused, isFalse);
      expect(workout.pausedFor, const Duration(minutes: 5));
    });

    testWidgets('holds the set timer, and drops a set being timed', (
      tester,
    ) async {
      await startSquats(tester);
      await tap(tester, 'set-timer-button');
      await wait(tester, const Duration(seconds: 20));
      await tap(tester, 'workout-pause');

      expect(textOf(tester, 'set-timer-label'), 'Paused');
      expect((await stored(tester)).single.setStartedAt, isNull);
      final button = tester.widget<FilledButton>(
        find.descendant(
          of: find.byKey(const ValueKey('set-timer-button')),
          matching: find.byType(FilledButton),
        ),
      );
      expect(button.onPressed, isNull);
    });

    testWidgets('survives the app closing', (tester) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 10));
      await tap(tester, 'workout-pause');

      await tester.pumpWidget(const SizedBox());
      await tester.pumpAndSettle();
      clock.elapse(const Duration(hours: 1));
      await openTrain(tester);
      await tap(tester, 'train-continue');

      expect(textOf(tester, 'workout-clock-state'), 'Paused');
      expect(textOf(tester, 'workout-elapsed'), '10:00');
    });

    testWidgets('is left out of the length of a finished workout', (
      tester,
    ) async {
      await startSquats(tester);
      await tap(tester, 'add-set-0');
      await tester.enterText(find.byKey(const ValueKey('set-0-0-reps')), '8');
      await tester.pumpAndSettle();
      await wait(tester, const Duration(minutes: 30));
      await tap(tester, 'workout-pause');
      await wait(tester, const Duration(minutes: 10));
      // Finished while still paused: the pause ends with the workout.
      await tester.dragUntilVisible(
        find.byKey(const ValueKey('workout-finish')),
        find.byType(ListView).last,
        const Offset(0, -200),
      );
      await tester.pumpAndSettle();
      await tap(tester, 'workout-finish');

      final workout = (await stored(tester)).single;
      expect(workout.paused, isFalse);
      expect(workout.pausedFor, const Duration(minutes: 10));
      expect(workout.endedAt, noon.add(const Duration(minutes: 40)));
      expect(find.text('1 exercise · 1 set · 30 min'), findsOneWidget);

      await tap(tester, 'workout-${workout.id}');
      expect(textOf(tester, 'workout-elapsed'), '30:00');
      expect(textOf(tester, 'workout-paused-for'), 'Paused for 10:00');
      expect(find.byKey(const ValueKey('workout-pause')), findsNothing);
    });
  });

  group('a workout\'s times, by hand', () {
    testWidgets('the end can be changed', (tester) async {
      final id = await saveFinished(tester);
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'workout-edit-times');
      await tap(tester, 'workout-time-end');
      await enterTime(tester, 7, 15);

      final workout = (await stored(tester)).single;
      expect(workout.endedAt, DateTime(2026, 10, 4, 19, 15));
      expect(workout.startedAt, DateTime(2026, 10, 4, 18));
      expect(find.text('7:15 PM'), findsOneWidget);
    });

    testWidgets('the start can be changed', (tester) async {
      final id = await saveFinished(tester);
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'workout-edit-times');
      await tap(tester, 'workout-time-start');
      await enterTime(tester, 5, 30);

      final workout = (await stored(tester)).single;
      expect(workout.startedAt, DateTime(2026, 10, 4, 17, 30));
      expect(workout.endedAt, DateTime(2026, 10, 4, 18, 50));
    });

    testWidgets('an end before the start is refused, with the reason', (
      tester,
    ) async {
      final id = await saveFinished(tester);
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'workout-edit-times');
      await tap(tester, 'workout-time-end');
      await enterTime(tester, 5, 0);

      expect(find.text('The end has to be after the start.'), findsOneWidget);
      final workout = (await stored(tester)).single;
      expect(workout.endedAt, DateTime(2026, 10, 4, 18, 50));
    });

    testWidgets('the day moves both times with it', (tester) async {
      final id = await saveFinished(tester);
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'workout-edit-times');
      await tap(tester, 'workout-time-date');
      await tester.tap(find.text('2'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();

      final workout = (await stored(tester)).single;
      expect(workout.date, CalendarDate(2026, 10, 2));
      expect(workout.startedAt, DateTime(2026, 10, 2, 18));
      expect(workout.endedAt, DateTime(2026, 10, 2, 18, 50));
    });
  });

  group('the set timer', () {
    testWidgets('times a set from Start set to Add set', (tester) async {
      await startSquats(tester);
      expect(textOf(tester, 'set-timer-label'), 'Set timer');

      await wait(tester, const Duration(minutes: 3));
      await tap(tester, 'set-timer-button');
      expect(textOf(tester, 'set-timer-label'), 'Set');

      await wait(tester, const Duration(seconds: 40));
      expect(textOf(tester, 'set-timer-time'), '0:40');
      await tap(tester, 'add-set-0');

      final workout = (await stored(tester)).single;
      final set = workout.exercises.single.sets.single;
      expect(set.startedAt, noon.add(const Duration(minutes: 3)));
      expect(set.duration, const Duration(seconds: 40));
      expect(workout.setStartedAt, isNull);
    });

    testWidgets('then counts the rest until the next set starts', (
      tester,
    ) async {
      await startSquats(tester);
      await tap(tester, 'set-timer-button');
      await wait(tester, const Duration(seconds: 30));
      await tap(tester, 'add-set-0');

      expect(textOf(tester, 'set-timer-label'), 'Rest');
      await wait(tester, const Duration(seconds: 90));
      expect(textOf(tester, 'set-timer-time'), '1:30');

      await tap(tester, 'set-timer-button');
      expect(textOf(tester, 'set-timer-label'), 'Set');
      expect(textOf(tester, 'set-timer-time'), '0:00');
    });

    testWidgets('a set logged without it has an end and no start', (
      tester,
    ) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 4));
      await tap(tester, 'add-set-0');

      final set = (await stored(tester)).single.exercises.single.sets.single;
      expect(set.startedAt, isNull);
      expect(set.endedAt, noon.add(const Duration(minutes: 4)));
      // The rest still counts from it.
      expect(textOf(tester, 'set-timer-label'), 'Rest');
    });

    testWidgets('can be cancelled without logging a set', (tester) async {
      await startSquats(tester);
      await tap(tester, 'set-timer-button');
      await tap(tester, 'set-timer-button');

      final workout = (await stored(tester)).single;
      expect(workout.setStartedAt, isNull);
      expect(workout.setCount, 0);
      expect(textOf(tester, 'set-timer-label'), 'Set timer');
    });

    testWidgets('and the rest both survive the app closing', (tester) async {
      await startSquats(tester);
      await tap(tester, 'add-set-0');
      await wait(tester, const Duration(seconds: 20));
      await tap(tester, 'set-timer-button');

      await tester.pumpWidget(const SizedBox());
      await tester.pumpAndSettle();
      clock.elapse(const Duration(minutes: 1));
      await openTrain(tester);
      await tap(tester, 'train-continue');

      expect(textOf(tester, 'set-timer-label'), 'Set');
      expect(textOf(tester, 'set-timer-time'), '1:00');
    });

    testWidgets('a set added to a finished workout gets no times', (
      tester,
    ) async {
      final id = await saveFinished(tester);
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'add-set-0');

      final sets = (await stored(tester)).single.exercises.single.sets;
      expect(sets.last.startedAt, isNull);
      expect(sets.last.endedAt, isNull);
    });
  });

  group('a set\'s times, by hand', () {
    testWidgets('a start can be typed', (tester) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 10));
      await tap(tester, 'add-set-0');
      expect(find.text('Not timed'), findsOneWidget);

      await tap(tester, 'set-0-0-start');
      await enterTime(tester, 12, 9);

      final set = (await stored(tester)).single.exercises.single.sets.single;
      expect(set.startedAt, noon.add(const Duration(minutes: 9)));
      expect(set.endedAt, noon.add(const Duration(minutes: 10)));
    });

    testWidgets('a start after the end is refused, with the reason', (
      tester,
    ) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 10));
      await tap(tester, 'add-set-0');
      await wait(tester, const Duration(minutes: 10));

      await tap(tester, 'set-0-0-start');
      await enterTime(tester, 12, 15);

      expect(find.text('The end has to be after the start.'), findsOneWidget);
      final set = (await stored(tester)).single.exercises.single.sets.single;
      expect(set.startedAt, isNull);
    });

    testWidgets('a time before the workout began is refused', (tester) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 10));
      await tap(tester, 'add-set-0');

      await tap(tester, 'set-0-0-start');
      await enterTime(tester, 11, 50, am: true);

      expect(find.text('That is before the workout started.'), findsOneWidget);
      final set = (await stored(tester)).single.exercises.single.sets.single;
      expect(set.startedAt, isNull);
    });
  });
}
