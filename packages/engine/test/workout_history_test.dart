import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-75 and MM-76: what the workout log says about last time and about
/// which exercises were used recently.
void main() {
  final monday = DateTime(2026, 10, 5, 18);

  Workout workout(int daysAgo, List<WorkoutExercise> exercises) {
    final startedAt = monday.subtract(Duration(days: daysAgo));
    return Workout(
      id: daysAgo + 1,
      date: CalendarDate.fromDateTime(startedAt),
      startedAt: startedAt,
      endedAt: startedAt.add(const Duration(hours: 1)),
      exercises: exercises,
    );
  }

  WorkoutExercise done(String id, [List<int> reps = const [8]]) =>
      WorkoutExercise(
        exerciseId: id,
        sets: [for (final r in reps) WorkoutSet(reps: r, loadKg: 100)],
      );

  group('recent exercises', () {
    test('none before anything is logged', () {
      expect(recentExerciseIds(const []), isEmpty);
    });

    test('most recent workout first, each exercise once', () {
      final ids = recentExerciseIds([
        workout(7, [done('back-squat'), done('leg-press')]),
        workout(0, [done('pull-up'), done('back-squat')]),
        workout(3, [done('barbell-bench-press')]),
      ]);
      expect(ids, [
        'pull-up',
        'back-squat',
        'barbell-bench-press',
        'leg-press',
      ]);
    });

    test('an exercise added with no sets yet still counts as used', () {
      expect(
        recentExerciseIds([
          workout(0, const [WorkoutExercise(exerciseId: 'dip')]),
        ]),
        ['dip'],
      );
    });
  });

  group('last time', () {
    test('nothing when the exercise was never logged', () {
      expect(
        previousSetsOf(
          exerciseId: 'back-squat',
          workouts: [
            workout(7, [done('pull-up')]),
          ],
          before: monday,
        ),
        isEmpty,
      );
    });

    test('the sets of the most recent earlier workout that has it', () {
      final sets = previousSetsOf(
        exerciseId: 'back-squat',
        workouts: [
          workout(14, [
            done('back-squat', [5, 5, 5]),
          ]),
          workout(7, [
            done('back-squat', [8, 7]),
          ]),
          workout(3, [done('pull-up')]),
        ],
        before: monday,
      );
      expect([for (final s in sets) s.reps], [8, 7]);
    });

    test('never the workout being logged, or a later one', () {
      final sets = previousSetsOf(
        exerciseId: 'back-squat',
        workouts: [
          workout(7, [
            done('back-squat', [8]),
          ]),
          workout(0, [
            done('back-squat', [12]),
          ]),
          workout(-2, [
            done('back-squat', [3]),
          ]),
        ],
        before: monday,
      );
      expect([for (final s in sets) s.reps], [8]);
    });

    test('a workout where it was added but not done is passed over', () {
      final sets = previousSetsOf(
        exerciseId: 'back-squat',
        workouts: [
          workout(14, [
            done('back-squat', [5]),
          ]),
          workout(7, const [WorkoutExercise(exerciseId: 'back-squat')]),
        ],
        before: monday,
      );
      expect([for (final s in sets) s.reps], [5]);
    });

    test('done twice in one workout, both lots are shown in order', () {
      final sets = previousSetsOf(
        exerciseId: 'back-squat',
        workouts: [
          workout(7, [
            done('back-squat', [5]),
            done('pull-up'),
            done('back-squat', [12, 10]),
          ]),
        ],
        before: monday,
      );
      expect([for (final s in sets) s.reps], [5, 12, 10]);
    });
  });
}
