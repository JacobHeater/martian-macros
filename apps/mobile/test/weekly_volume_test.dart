import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:martian_macros/src/providers.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:martian_macros/src/train/weekly_volume_screen.dart';
import 'package:martian_macros/src/train/train_screen.dart';
import 'package:martian_macros/src/ui/muscle_volume_row.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 11);
  Workout workout({
    int age = 0,
    int count = 4,
    String id = 'barbell-bench-press',
  }) {
    final date = today.addDays(-age);
    final start = DateTime(date.year, date.month, date.day);
    return Workout(
      id: 0,
      date: date,
      startedAt: start,
      endedAt: start.add(const Duration(hours: 1)),
      exercises: [
        WorkoutExercise(
          exerciseId: id,
          sets: [
            for (var i = 0; i < count; i++)
              const WorkoutSet(reps: 10, loadKg: 100),
          ],
        ),
      ],
    );
  }

  Future<void> pump(
    WidgetTester tester,
    InMemoryRepositories repos, {
    List<Override> overrides = const [],
    bool settle = true,
    Widget home = const WeeklyVolumeScreen(),
  }) async {
    tester.view.physicalSize = const Size(320, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          clockProvider.overrideWithValue(FixedClock(today)),
          ...overrides,
        ],
        child: MaterialApp(
          theme: mmTheme(Brightness.light),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: TextScaler.linear(1.5)),
            child: child!,
          ),
          home: home,
        ),
      ),
    );
    if (settle) {
      await tester.pumpAndSettle();
    } else {
      await tester.pump();
    }
  }

  testWidgets('all groups, exact half sets, zero and reactive edit/delete', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    final id = await repos.workouts.saveWorkout(workout(count: 3));
    await repos.workouts.saveWorkout(workout(age: 7, count: 4));
    await pump(tester, repos);
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('volume-chest')),
      300,
    );
    await tester.pumpAndSettle();
    expect(find.text('3 hard sets'), findsOneWidget);
    expect(find.text('Previous: 4 · change: -1'), findsOneWidget);
    await repos.workouts.saveWorkout(workout(count: 30).copyWith(id: id));
    await tester.pumpAndSettle();
    expect(find.text('30 hard sets'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await repos.workouts.deleteWorkout(id);
    await tester.pumpAndSettle();
    expect(find.text('Previous: 4 · change: -4'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('volume-hamstrings')),
      300,
    );
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<MuscleVolumeRow>(
            find.byKey(const ValueKey('volume-hamstrings')),
          )
          .volume
          .currentSets,
      0,
    );
    expect(tester.takeException(), isNull);
  });
  testWidgets('MM-195 volume accessible during workout', (tester) async {
    final repos = InMemoryRepositories();
    await repos.workouts.saveWorkout(workout().copyWith(endedAt: () => null));
    await pump(tester, repos, home: const Scaffold(body: TrainScreen()));
    expect(find.text('Continue'), findsOneWidget);
    expect(find.byKey(const ValueKey('train-volume')), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('train-volume')));
    await tester.pumpAndSettle();
    expect(find.text('Last seven days'), findsOneWidget);
  });

  testWidgets('unknown mappings explicitly omitted', (tester) async {
    final repos = InMemoryRepositories();
    await repos.workouts.saveWorkout(workout(id: 'custom-deleted'));
    await pump(tester, repos);
    expect(
      find.textContaining('4 current and 0 previous hard sets omitted'),
      findsOneWidget,
    );
  });

  testWidgets('reference band and above-range volumes have exact geometry', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      MaterialApp(
        theme: mmTheme(Brightness.light),
        home: const Scaffold(
          body: Center(
            child: SizedBox(
              width: 300,
              child: MuscleVolumeRow(
                volume: MuscleVolume(
                  group: MuscleGroup.chest,
                  currentSets: 30,
                  previousSets: 15,
                ),
              ),
            ),
          ),
        ),
      ),
    );
    final layers = tester
        .widgetList<Positioned>(
          find.descendant(
            of: find.byType(MuscleVolumeRow),
            matching: find.byType(Positioned),
          ),
        )
        .toList();
    expect(layers[1].left, 100);
    expect(layers[1].width, 100);
    expect(layers[2].width, 300);
    expect(layers[3].left, 150);
    expect(
      find.bySemanticsLabel(RegExp('Chest: 30 current hard sets; 15 previous')),
      findsOneWidget,
    );
    semantics.dispose();
  });

  testWidgets('custom mapping edits reassign volume reactively', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    final source = builtInExercises.first;
    final id = await repos.customExercises.saveCustomExercise(
      Exercise(
        id: '',
        name: 'Custom lift',
        equipment: source.equipment,
        primary: MuscleGroup.chest,
        secondary: [MuscleGroup.triceps],
      ),
    );
    await repos.workouts.saveWorkout(workout(id: id, count: 3));
    await pump(tester, repos);
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('volume-chest')),
      300,
    );
    await tester.pumpAndSettle();
    final chest = find.byKey(const ValueKey('volume-chest'));
    expect(tester.widget<MuscleVolumeRow>(chest).volume.currentSets, 3);
    await repos.customExercises.saveCustomExercise(
      Exercise(
        id: id,
        name: 'Custom lift',
        equipment: source.equipment,
        primary: MuscleGroup.back,
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.widget<MuscleVolumeRow>(chest).volume.currentSets, 0);
    await repos.customExercises.deleteCustomExercise(id);
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Last seven days'), -300);
    await tester.pumpAndSettle();
    expect(
      find.textContaining('3 current and 0 previous hard sets omitted'),
      findsOneWidget,
    );
  });
  for (final custom in [false, true]) {
    testWidgets('${custom ? 'exercise' : 'workout'} loading, error and retry', (
      tester,
    ) async {
      final repos = InMemoryRepositories();
      final workouts = StreamController<List<Workout>>();
      final exercises = StreamController<List<Exercise>>();
      addTearDown(custom ? exercises.close : workouts.close);
      var reads = 0;
      await pump(
        tester,
        repos,
        settle: false,
        overrides: [
          if (custom)
            customExercisesProvider.overrideWith((ref) {
              reads++;
              return reads == 1 ? exercises.stream : Stream.value([]);
            })
          else
            workoutsProvider.overrideWith((ref) {
              reads++;
              return reads == 1 ? workouts.stream : Stream.value([]);
            }),
        ],
      );
      expect(find.byType(MuscleVolumeRow), findsNothing);
      if (custom) {
        exercises.addError(StateError('read failed'));
      } else {
        workouts.addError(StateError('read failed'));
      }
      await tester.pumpAndSettle();
      expect(find.text('Retry volume'), findsOneWidget);
      await tester.tap(find.text('Retry volume'));
      await tester.pumpAndSettle();
      expect(find.text('Last seven days'), findsOneWidget);
      expect(reads, 2);
    });
  }
}
