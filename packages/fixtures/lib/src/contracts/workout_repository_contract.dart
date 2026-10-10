import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

/// What every [WorkoutRepository] must do (MM-75).
void workoutRepositoryContract(
  String name,
  WorkoutRepository Function() create,
) {
  group('$name as a WorkoutRepository', () {
    late WorkoutRepository repo;
    final day = CalendarDate(2026, 10, 5);
    final six = DateTime(2026, 10, 5, 18);

    Workout workout({
      int id = 0,
      DateTime? startedAt,
      DateTime? endedAt,
      List<WorkoutExercise> exercises = const [],
    }) => Workout(
      id: id,
      date: day,
      startedAt: startedAt ?? six,
      endedAt: endedAt,
      exercises: exercises,
    );

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchWorkouts().first, isEmpty);
    });

    test('a saved workout is read back with every field', () async {
      final id = await repo.saveWorkout(
        workout(
          endedAt: six.add(const Duration(minutes: 55)),
          exercises: const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [
                WorkoutSet(reps: 8, loadKg: 100, rir: 2),
                WorkoutSet(reps: 7, loadKg: 102.5),
              ],
            ),
            WorkoutExercise(
              exerciseId: 'pull-up',
              sets: [WorkoutSet(reps: 6, loadKg: -20, rir: 0)],
            ),
          ],
        ),
      );
      expect(id, greaterThan(0));
      final read = (await repo.watchWorkouts().first).single;
      expect(read.id, id);
      expect(read.date, day);
      expect(read.startedAt.isAtSameMomentAs(six), isTrue);
      expect(
        read.endedAt!.isAtSameMomentAs(six.add(const Duration(minutes: 55))),
        isTrue,
      );
      expect(read.inProgress, isFalse);
      expect(
        [for (final e in read.exercises) e.exerciseId],
        ['back-squat', 'pull-up'],
      );
      final squat = read.exercises.first.sets;
      expect([for (final s in squat) s.reps], [8, 7]);
      expect([for (final s in squat) s.loadKg], [100, 102.5]);
      expect([for (final s in squat) s.rir], [2, null]);
      final pullUp = read.exercises.last.sets.single;
      expect(pullUp.loadKg, -20);
      expect(pullUp.rir, 0);
    });

    test('set times and the running set timer are kept', () async {
      final start = six.add(const Duration(minutes: 3));
      final end = start.add(const Duration(seconds: 42));
      final timing = end.add(const Duration(minutes: 2));
      await repo.saveWorkout(
        Workout(
          id: 0,
          date: day,
          startedAt: six,
          setStartedAt: timing,
          exercises: [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [
                WorkoutSet(
                  reps: 8,
                  loadKg: 100,
                  startedAt: start,
                  endedAt: end,
                ),
                WorkoutSet(reps: 8, loadKg: 100, endedAt: end),
                const WorkoutSet(reps: 8, loadKg: 100),
              ],
            ),
          ],
        ),
      );
      final read = (await repo.watchWorkouts().first).single;
      expect(read.setStartedAt!.isAtSameMomentAs(timing), isTrue);
      final sets = read.exercises.single.sets;
      expect(sets[0].startedAt!.isAtSameMomentAs(start), isTrue);
      expect(sets[0].endedAt!.isAtSameMomentAs(end), isTrue);
      expect(sets[0].duration, const Duration(seconds: 42));
      expect(sets[1].startedAt, isNull);
      expect(sets[1].endedAt!.isAtSameMomentAs(end), isTrue);
      expect(sets[1].duration, isNull);
      expect(sets[2].startedAt, isNull);
      expect(sets[2].endedAt, isNull);
    });

    test('a workout in progress has no end', () async {
      await repo.saveWorkout(workout());
      final read = (await repo.watchWorkouts().first).single;
      expect(read.endedAt, isNull);
      expect(read.setStartedAt, isNull);
      expect(read.inProgress, isTrue);
    });

    test('an exercise with no sets yet is kept, in its place', () async {
      await repo.saveWorkout(
        workout(
          exercises: const [
            WorkoutExercise(exerciseId: 'back-squat'),
            WorkoutExercise(
              exerciseId: 'leg-press',
              sets: [WorkoutSet(reps: 10, loadKg: 180)],
            ),
            WorkoutExercise(exerciseId: 'leg-curl'),
          ],
        ),
      );
      final read = (await repo.watchWorkouts().first).single;
      expect(
        [for (final e in read.exercises) e.exerciseId],
        ['back-squat', 'leg-press', 'leg-curl'],
      );
      expect([for (final e in read.exercises) e.sets.length], [0, 1, 0]);
    });

    test('the same exercise twice in a workout stays two entries', () async {
      await repo.saveWorkout(
        workout(
          exercises: const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [WorkoutSet(reps: 5, loadKg: 120)],
            ),
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [WorkoutSet(reps: 12, loadKg: 80)],
            ),
          ],
        ),
      );
      final read = (await repo.watchWorkouts().first).single;
      expect(read.exercises, hasLength(2));
      expect(read.exercises.first.sets.single.reps, 5);
      expect(read.exercises.last.sets.single.reps, 12);
    });

    test('saving with an id replaces that workout and its sets', () async {
      final id = await repo.saveWorkout(
        workout(
          exercises: const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [
                WorkoutSet(reps: 8, loadKg: 100),
                WorkoutSet(reps: 8, loadKg: 100),
              ],
            ),
          ],
        ),
      );
      final same = await repo.saveWorkout(
        workout(
          id: id,
          endedAt: six.add(const Duration(hours: 1)),
          exercises: const [
            WorkoutExercise(
              exerciseId: 'front-squat',
              sets: [WorkoutSet(reps: 5, loadKg: 90, rir: 1)],
            ),
          ],
        ),
      );
      expect(same, id);
      final all = await repo.watchWorkouts().first;
      expect(all, hasLength(1));
      expect(all.single.inProgress, isFalse);
      expect(all.single.exercises.single.exerciseId, 'front-squat');
      expect(all.single.setCount, 1);
    });

    test('lists workouts most recently started first', () async {
      final older = await repo.saveWorkout(
        workout(startedAt: six.subtract(const Duration(days: 2))),
      );
      final newer = await repo.saveWorkout(workout());
      final all = await repo.watchWorkouts().first;
      expect([for (final w in all) w.id], [newer, older]);
    });

    test('ids are not reused after a delete', () async {
      final first = await repo.saveWorkout(workout());
      await repo.deleteWorkout(first);
      expect(await repo.saveWorkout(workout()), greaterThan(first));
    });

    test('deletes a workout with its sets; a missing one is ignored', () async {
      final keep = await repo.saveWorkout(
        workout(
          exercises: const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [WorkoutSet(reps: 8, loadKg: 100)],
            ),
          ],
        ),
      );
      final gone = await repo.saveWorkout(
        workout(
          exercises: const [
            WorkoutExercise(
              exerciseId: 'pull-up',
              sets: [WorkoutSet(reps: 6, loadKg: 0)],
            ),
          ],
        ),
      );
      await repo.deleteWorkout(gone);
      await repo.deleteWorkout(gone + 100);
      final all = await repo.watchWorkouts().first;
      expect(all.single.id, keep);
      expect(all.single.exercises.single.exerciseId, 'back-squat');
      expect(all.single.setCount, 1);
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchWorkouts().map((all) => all.length),
        before: 0,
        change: () => repo.saveWorkout(workout()),
        after: 1,
      );
    });

    test('emits when only a set changes', () async {
      final id = await repo.saveWorkout(
        workout(
          exercises: const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [WorkoutSet(reps: 8, loadKg: 100)],
            ),
          ],
        ),
      );
      await expectChangeEmits(
        repo.watchWorkouts().map((all) => all.single.setCount),
        before: 1,
        change: () => repo.saveWorkout(
          workout(
            id: id,
            exercises: const [
              WorkoutExercise(
                exerciseId: 'back-squat',
                sets: [
                  WorkoutSet(reps: 8, loadKg: 100),
                  WorkoutSet(reps: 8, loadKg: 100),
                ],
              ),
            ],
          ),
        ),
        after: 2,
      );
    });
  });
}
