import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/train/rest_signal_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-191: a target rest per exercise with its countdown and signal, a
/// set's times typed to the second, and a workout that ends after midnight.
void main() {
  final today = CalendarDate(2026, 10, 5);
  final noon = DateTime(2026, 10, 5, 12);
  late InMemoryRepositories repos;
  late FixedClock clock;
  late InMemoryRestSignal signal;

  setUp(() async {
    repos = InMemoryRepositories();
    clock = FixedClock(today);
    signal = InMemoryRestSignal();
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

  /// Lets [time] pass, on the app's clock and for its timers alike.
  Future<void> wait(WidgetTester tester, Duration time) async {
    clock.elapse(time);
    await tester.pump(time);
  }

  Future<void> openTrain(WidgetTester tester) async {
    await pumpApp(
      tester,
      repos,
      clock,
      overrides: [restSignalProvider.overrideWithValue(signal)],
    );
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

  /// Chooses the rest target at [option] of the list: 0 none, 1 1:00,
  /// 2 1:30, 3 2:00, 4 3:00, 5 5:00.
  Future<void> chooseRest(WidgetTester tester, int option) async {
    await tap(tester, 'rest-target-0');
    await tap(tester, 'option-$option');
  }

  /// Types a time into the clock time entry and confirms it.
  Future<void> enterClock(
    WidgetTester tester,
    int hour,
    int minute,
    int second, {
    bool? pm,
  }) async {
    await tester.enterText(find.byKey(const ValueKey('clock-hour')), '$hour');
    await tester.enterText(
      find.byKey(const ValueKey('clock-minute')),
      '$minute',
    );
    await tester.enterText(
      find.byKey(const ValueKey('clock-second')),
      '$second',
    );
    if (pm != null) {
      await tester.tap(
        find.descendant(
          of: find.byKey(const ValueKey('clock-period')),
          matching: find.text(pm ? 'PM' : 'AM'),
        ),
      );
      await tester.pumpAndSettle();
    }
    await tester.tap(find.byKey(const ValueKey('clock-ok')));
    await tester.pumpAndSettle();
  }

  /// Types a time into the system time picker and confirms it.
  Future<void> enterTime(
    WidgetTester tester,
    int hour,
    int minute, {
    bool? pm,
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
    if (pm != null) {
      await tester.tap(find.text(pm ? 'PM' : 'AM'));
      await tester.pumpAndSettle();
    }
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
  }

  /// A workout from 11:30 PM two days ago to 11:50 PM that night.
  Future<int> saveLateWorkout() => repos.workouts.saveWorkout(
    Workout(
      id: 0,
      date: today.addDays(-2),
      startedAt: DateTime(2026, 10, 3, 23, 30),
      endedAt: DateTime(2026, 10, 3, 23, 50),
      exercises: const [
        WorkoutExercise(
          exerciseId: 'back-squat',
          sets: [WorkoutSet(reps: 8, loadKg: 100)],
        ),
      ],
    ),
  );

  group('a target rest', () {
    testWidgets('starts as none, and the rest then counts up', (tester) async {
      await startSquats(tester);
      expect(find.text('None'), findsOneWidget);
      await tap(tester, 'add-set-0');
      await wait(tester, const Duration(seconds: 45));

      expect(textOf(tester, 'set-timer-label'), 'Rest');
      expect(textOf(tester, 'set-timer-time'), '0:45');
      expect((await stored(tester)).single.exercises.single.restTarget, isNull);
    });

    testWidgets('is counted down to', (tester) async {
      await startSquats(tester);
      await chooseRest(tester, 3);
      expect(
        (await stored(tester)).single.exercises.single.restTarget,
        const Duration(minutes: 2),
      );

      await tap(tester, 'add-set-0');
      await wait(tester, const Duration(seconds: 90));

      expect(textOf(tester, 'set-timer-label'), 'Rest left · 2:00 target');
      expect(textOf(tester, 'set-timer-time'), '0:30');
    });

    testWidgets('is signalled once when reached, and the rest counts on', (
      tester,
    ) async {
      await startSquats(tester);
      await chooseRest(tester, 1);
      await tap(tester, 'add-set-0');

      await wait(tester, const Duration(seconds: 59));
      expect(signal.signalled, 0);

      await wait(tester, const Duration(seconds: 1));
      expect(signal.signalled, 1);
      expect(
        textOf(tester, 'set-timer-label'),
        'Target rest reached · 1:00 target',
      );
      expect(textOf(tester, 'set-timer-time'), '1:00');

      await wait(tester, const Duration(seconds: 30));
      expect(signal.signalled, 1);
      expect(textOf(tester, 'set-timer-time'), '1:30');
    });

    testWidgets('changed mid-rest is measured from when the rest began', (
      tester,
    ) async {
      await startSquats(tester);
      await chooseRest(tester, 5);
      await tap(tester, 'add-set-0');
      await wait(tester, const Duration(seconds: 40));

      await chooseRest(tester, 1);
      await tester.pump(const Duration(seconds: 1));
      expect(textOf(tester, 'set-timer-time'), '0:20');

      await wait(tester, const Duration(seconds: 20));
      expect(signal.signalled, 1);
    });

    testWidgets('turned off stops the countdown and the signal', (
      tester,
    ) async {
      await startSquats(tester);
      await chooseRest(tester, 1);
      await tap(tester, 'add-set-0');
      await wait(tester, const Duration(seconds: 20));

      await chooseRest(tester, 0);
      await wait(tester, const Duration(seconds: 60));
      expect(signal.signalled, 0);
      expect(textOf(tester, 'set-timer-label'), 'Rest');
      expect(textOf(tester, 'set-timer-time'), '1:20');
    });

    testWidgets('is not signalled while a set is being timed', (tester) async {
      await startSquats(tester);
      await chooseRest(tester, 1);
      await tap(tester, 'add-set-0');
      await wait(tester, const Duration(seconds: 30));

      await tap(tester, 'set-timer-button');
      await wait(tester, const Duration(seconds: 60));
      expect(signal.signalled, 0);
      expect(textOf(tester, 'set-timer-label'), 'Set');
    });

    testWidgets('is not signalled while the workout is paused', (tester) async {
      await startSquats(tester);
      await chooseRest(tester, 1);
      await tap(tester, 'add-set-0');
      await wait(tester, const Duration(seconds: 30));

      await tap(tester, 'workout-pause');
      await wait(tester, const Duration(seconds: 60));
      expect(signal.signalled, 0);
      expect(textOf(tester, 'set-timer-label'), 'Paused');
    });

    testWidgets('already passed when the app opens is shown, not signalled', (
      tester,
    ) async {
      await repos.workouts.saveWorkout(
        Workout(
          id: 0,
          date: today,
          startedAt: noon.subtract(const Duration(minutes: 20)),
          exercises: [
            WorkoutExercise(
              exerciseId: 'back-squat',
              restTarget: const Duration(minutes: 2),
              sets: [
                WorkoutSet(
                  reps: 8,
                  loadKg: 100,
                  endedAt: noon.subtract(const Duration(minutes: 5)),
                ),
              ],
            ),
          ],
        ),
      );
      await openTrain(tester);
      await tap(tester, 'train-continue');
      await wait(tester, const Duration(seconds: 10));

      expect(signal.signalled, 0);
      expect(
        textOf(tester, 'set-timer-label'),
        'Target rest reached · 2:00 target',
      );
      expect(textOf(tester, 'set-timer-time'), '5:10');
    });

    testWidgets('is there again the next time the exercise is added', (
      tester,
    ) async {
      await repos.workouts.saveWorkout(
        Workout(
          id: 0,
          date: today.addDays(-2),
          startedAt: DateTime(2026, 10, 3, 18),
          endedAt: DateTime(2026, 10, 3, 19),
          exercises: const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              restTarget: Duration(minutes: 3),
              sets: [WorkoutSet(reps: 8, loadKg: 100)],
            ),
          ],
        ),
      );
      await startSquats(tester);

      expect(find.text('3:00'), findsOneWidget);
      final workout = (await stored(tester)).first;
      expect(workout.inProgress, isTrue);
      expect(workout.exercises.single.restTarget, const Duration(minutes: 3));
    });

    testWidgets('comes with the exercises of a repeated workout', (
      tester,
    ) async {
      await repos.workouts.saveWorkout(
        Workout(
          id: 0,
          date: today.addDays(-2),
          startedAt: DateTime(2026, 10, 3, 18),
          endedAt: DateTime(2026, 10, 3, 19),
          exercises: const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              restTarget: Duration(seconds: 90),
              sets: [WorkoutSet(reps: 8, loadKg: 100)],
            ),
          ],
        ),
      );
      await openTrain(tester);
      await tap(tester, 'train-repeat');

      final workout = (await stored(tester)).first;
      expect(workout.exercises.single.restTarget, const Duration(seconds: 90));
    });
  });

  group('a set\'s times, to the second', () {
    testWidgets('a start and an end can be typed', (tester) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 10));
      await tap(tester, 'add-set-0');

      await tap(tester, 'set-0-0-end');
      await enterClock(tester, 12, 2, 55);
      await tap(tester, 'set-0-0-start');
      await enterClock(tester, 12, 2, 10);

      final set = (await stored(tester)).single.exercises.single.sets.single;
      expect(set.startedAt, DateTime(2026, 10, 5, 12, 2, 10));
      expect(set.endedAt, DateTime(2026, 10, 5, 12, 2, 55));
      expect(find.text('12:02:10 PM'), findsOneWidget);
      expect(find.text('12:02:55 PM'), findsOneWidget);
    });

    testWidgets('the entry opens on the time the set has', (tester) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 10, seconds: 7));
      await tap(tester, 'add-set-0');
      await tap(tester, 'set-0-0-end');

      String field(String key) => tester
          .widget<TextField>(
            find.descendant(
              of: find.byKey(ValueKey(key)),
              matching: find.byType(TextField),
            ),
          )
          .controller!
          .text;
      expect(field('clock-hour'), '12');
      expect(field('clock-minute'), '10');
      expect(field('clock-second'), '07');
    });

    testWidgets('a number that is no time is refused in the entry', (
      tester,
    ) async {
      await startSquats(tester);
      await wait(tester, const Duration(minutes: 10));
      await tap(tester, 'add-set-0');
      await tap(tester, 'set-0-0-start');
      await enterClock(tester, 12, 5, 75);

      expect(find.text('The second is from 0 to 59.'), findsOneWidget);
      await tester.enterText(find.byKey(const ValueKey('clock-hour')), '13');
      await tester.tap(find.byKey(const ValueKey('clock-ok')));
      await tester.pumpAndSettle();
      expect(find.text('The hour is from 1 to 12.'), findsOneWidget);

      await tap(tester, 'clock-cancel');
      final set = (await stored(tester)).single.exercises.single.sets.single;
      expect(set.startedAt, isNull);
    });

    testWidgets('after midnight is on the next day, in a workout that ran '
        'past it', (tester) async {
      final id = await repos.workouts.saveWorkout(
        Workout(
          id: 0,
          date: today.addDays(-2),
          startedAt: DateTime(2026, 10, 3, 23, 30),
          endedAt: DateTime(2026, 10, 4, 0, 40),
          exercises: const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [WorkoutSet(reps: 8, loadKg: 100)],
            ),
          ],
        ),
      );
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'set-0-0');
      await tap(tester, 'set-0-0-end');
      await enterClock(tester, 12, 10, 30, pm: false);

      final set = (await stored(tester)).single.exercises.single.sets.single;
      expect(set.endedAt, DateTime(2026, 10, 4, 0, 10, 30));
    });
  });

  group('a workout that ends after midnight', () {
    testWidgets('has its typed end put on the next day', (tester) async {
      final id = await saveLateWorkout();
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'workout-edit-times');
      await tap(tester, 'workout-time-end');
      await enterTime(tester, 12, 20, pm: false);

      final workout = (await stored(tester)).single;
      expect(workout.startedAt, DateTime(2026, 10, 3, 23, 30));
      expect(workout.endedAt, DateTime(2026, 10, 4, 0, 20));
      expect(find.text('12:20 AM, next day'), findsOneWidget);
    });

    testWidgets('keeps its end on the day after when its day is changed', (
      tester,
    ) async {
      final id = await saveLateWorkout();
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'workout-edit-times');
      await tap(tester, 'workout-time-end');
      await enterTime(tester, 12, 20, pm: false);

      await tap(tester, 'workout-time-date');
      await tester.tap(find.text('2'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();

      final workout = (await stored(tester)).single;
      expect(workout.date, CalendarDate(2026, 10, 2));
      expect(workout.startedAt, DateTime(2026, 10, 2, 23, 30));
      expect(workout.endedAt, DateTime(2026, 10, 3, 0, 20));
    });

    testWidgets('does not get an end most of a day on from a slip', (
      tester,
    ) async {
      final id = await saveLateWorkout();
      await openTrain(tester);
      await tap(tester, 'workout-$id');
      await tap(tester, 'workout-edit-times');
      await tap(tester, 'workout-time-end');
      await enterTime(tester, 11, 20);

      expect(find.text('The end has to be after the start.'), findsOneWidget);
      final workout = (await stored(tester)).single;
      expect(workout.endedAt, DateTime(2026, 10, 3, 23, 50));
    });
  });
}
