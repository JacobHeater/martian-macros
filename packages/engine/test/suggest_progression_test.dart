import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-79: what to try next for an exercise, by double progression.
void main() {
  final squat = builtInExercises.firstWhere((e) => e.id == 'back-squat');
  final pullUp = builtInExercises.firstWhere((e) => e.id == 'pull-up');
  final raise = builtInExercises.firstWhere(
    (e) => e.id == 'dumbbell-lateral-raise',
  );
  final machine = builtInExercises.firstWhere(
    (e) =>
        e.equipment == Equipment.machine && e.load == ExerciseLoad.addedWeight,
  );
  final now = DateTime(2026, 10, 12, 18);
  var nextId = 1;

  /// A finished workout [daysAgo] with one exercise: sets of (reps, kg).
  Workout session(
    int daysAgo,
    List<(int, double)> sets, {
    Exercise? of,
    bool finished = true,
  }) {
    final start = now.subtract(Duration(days: daysAgo));
    return Workout(
      id: nextId++,
      date: CalendarDate.fromDateTime(start),
      startedAt: start,
      endedAt: finished ? start.add(const Duration(minutes: 50)) : null,
      exercises: [
        WorkoutExercise(
          exerciseId: (of ?? squat).id,
          sets: [
            for (final (reps, kg) in sets) WorkoutSet(reps: reps, loadKg: kg),
          ],
        ),
      ],
    );
  }

  ProgressionSuggestion? suggest(
    List<Workout> workouts, {
    Exercise? of,
    GoalMode goal = GoalMode.leanGain,
    UnitSystem units = UnitSystem.metric,
  }) => suggestProgression(
    exerciseId: (of ?? squat).id,
    exercise: of ?? squat,
    workouts: workouts,
    before: now,
    goal: goal,
    units: units,
  );

  test('there is nothing to suggest for an exercise never done', () {
    expect(suggest(const []), isNull);
    expect(
      suggest([
        session(7, [(8, 60)], of: pullUp),
      ]),
      isNull,
    );
  });

  test('a workout still in progress is not last time', () {
    expect(
      suggest([
        session(1, [(8, 60)], finished: false),
      ]),
      isNull,
    );
  });

  test('short of the top of the range: the same load, for more reps', () {
    final s = suggest([
      session(7, [(8, 60), (8, 60), (7, 60)]),
    ])!;
    expect(s.kind, ProgressionKind.addReps);
    expect(s.loadKg, 60);
    expect(s.reps, 8);
    expect(s.lastLoadKg, 60);
    expect(s.lastReps, [8, 8, 7]);
  });

  test('every set at the top of the range: more load, at the bottom', () {
    final s = suggest([
      session(7, [(10, 60), (10, 60), (10, 60)]),
    ])!;
    expect(s.kind, ProgressionKind.addLoad);
    expect(s.loadKg, 62.5);
    expect(s.reps, 6);
    expect(s.rangeTop, 10);
  });

  test('only the sets at the top load count, so warm-ups do not', () {
    final s = suggest([
      session(7, [(10, 20), (5, 40), (10, 60), (10, 60)]),
    ])!;
    expect(s.kind, ProgressionKind.addLoad);
    expect(s.lastReps, [10, 10]);

    final backOff = suggest([
      session(7, [(7, 60), (10, 50), (10, 50)]),
    ])!;
    expect(backOff.kind, ProgressionKind.addReps);
    expect(backOff.loadKg, 60);
    expect(backOff.reps, 7);
  });

  test('reps below the range are brought up to its bottom, never the load '
      'down', () {
    final s = suggest([
      session(7, [(4, 60), (3, 60)]),
    ])!;
    expect(s.kind, ProgressionKind.addReps);
    expect(s.loadKg, 60);
    expect(s.reps, 6);
  });

  test('the range is 8 to 12 for a lift that is not a barbell lift', () {
    expect(defaultRepRange(squat), (6, 10));
    expect(defaultRepRange(raise), (8, 12));
    expect(defaultRepRange(null), (8, 12));
    final s = suggest([
      session(7, [(10, 8), (10, 8)], of: raise),
    ], of: raise)!;
    expect(s.kind, ProgressionKind.addReps);
    expect(s.reps, 10);
  });

  group('on a fat loss goal', () {
    test('the suggestion is to match last time', () {
      final s = suggest([
        session(7, [(8, 60), (8, 60), (7, 60)]),
      ], goal: GoalMode.fatLoss)!;
      expect(s.kind, ProgressionKind.match);
      expect(s.loadKg, 60);
      expect(s.reps, 8);
    });

    test('even with every set at the top, and even when stalled', () {
      expect(
        suggest([
          session(7, [(10, 60), (10, 60)]),
        ], goal: GoalMode.fatLoss)!.kind,
        ProgressionKind.match,
      );
      expect(
        suggest([
          session(7, [(8, 60)]),
          session(14, [(8, 60)]),
          session(21, [(8, 60)]),
        ], goal: GoalMode.fatLoss)!.kind,
        ProgressionKind.match,
      );
    });
  });

  group('a stall', () {
    test('is three sessions at one load without more reps: hold', () {
      final s = suggest([
        session(7, [(8, 60), (7, 60)]),
        session(14, [(8, 60), (6, 60)]),
        session(21, [(8, 60), (7, 60)]),
      ])!;
      expect(s.kind, ProgressionKind.hold);
      expect(s.loadKg, 60);
      expect(s.reps, 8);
    });

    test('is not two sessions: one bad day is not a stall', () {
      final s = suggest([
        session(7, [(8, 60), (7, 60)]),
        session(14, [(8, 60), (7, 60)]),
      ])!;
      expect(s.kind, ProgressionKind.addReps);
    });

    test('is not called when either later session had more reps', () {
      expect(
        suggest([
          session(7, [(8, 60), (7, 60)]),
          session(14, [(8, 60), (8, 60)]),
          session(21, [(8, 60), (7, 60)]),
        ])!.kind,
        ProgressionKind.addReps,
      );
    });

    test('is not called across a change of load', () {
      expect(
        suggest([
          session(7, [(6, 62.5)]),
          session(14, [(6, 62.5)]),
          session(21, [(10, 60)]),
        ])!.kind,
        ProgressionKind.addReps,
      );
    });

    test('is not called across a gap of more than 28 days', () {
      expect(
        suggest([
          session(7, [(8, 60)]),
          session(14, [(8, 60)]),
          session(50, [(8, 60)]),
        ])!.kind,
        ProgressionKind.addReps,
      );
    });

    test('gives way to more load when every set is at the top', () {
      expect(
        suggest([
          session(7, [(10, 60)]),
          session(14, [(10, 60)]),
          session(21, [(10, 60)]),
        ])!.kind,
        ProgressionKind.addLoad,
      );
    });
  });

  group('the step up in load', () {
    double? next(Exercise? exercise, double kg, [UnitSystem? units]) =>
        nextLoadKg(
          exercise: exercise,
          units: units ?? UnitSystem.metric,
          loadKg: kg,
        );

    test('is 2.5 kg for a barbell, 2 for a dumbbell, 5 for a machine', () {
      expect(next(squat, 60), 62.5);
      expect(next(raise, 8), 10);
      expect(next(machine, 40), 45);
      expect(next(null, 40), 42.5);
    });

    test('is a round number of pounds for someone who lifts in pounds', () {
      final from = Units.lbToKg(135);
      expect(
        Units.kgToLb(next(squat, from, UnitSystem.imperial)!),
        closeTo(140, 1e-9),
      );
      expect(
        Units.kgToLb(next(machine, from, UnitSystem.imperial)!),
        closeTo(145, 1e-9),
      );
    });

    test('is 2.5 kg on weight added to the body', () {
      expect(next(pullUp, 5), 7.5);
    });

    test('is 5 kg less help for assisted work, never past none', () {
      expect(next(pullUp, -20), -15);
      expect(next(pullUp, -3), 0);
    });

    test('is nothing for the body alone: more reps instead, past the '
        'range', () {
      expect(next(pullUp, 0), isNull);
      final s = suggest([
        session(7, [(14, 0), (12, 0)], of: pullUp),
      ], of: pullUp)!;
      expect(s.kind, ProgressionKind.addReps);
      expect(s.loadKg, 0);
      expect(s.reps, 14);
    });
  });
}
