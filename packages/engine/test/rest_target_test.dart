import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-191: the rest a user means to take, and where a typed time of day
/// falls for a workout that runs past midnight.
void main() {
  final six = DateTime(2026, 10, 5, 18);
  DateTime at(int minutes) => six.add(Duration(minutes: minutes));

  Workout workout(
    List<WorkoutExercise> exercises, {
    int id = 1,
    DateTime? startedAt,
  }) => Workout(
    id: id,
    date: CalendarDate(2026, 10, 5),
    startedAt: startedAt ?? six,
    exercises: exercises,
  );

  group('the rest target now', () {
    test('is that of the exercise whose set ended last', () {
      final target = restTargetOf(
        workout([
          WorkoutExercise(
            exerciseId: 'back-squat',
            restTarget: const Duration(minutes: 3),
            sets: [WorkoutSet(reps: 8, loadKg: 100, endedAt: at(5))],
          ),
          WorkoutExercise(
            exerciseId: 'leg-curl',
            restTarget: const Duration(seconds: 90),
            sets: [WorkoutSet(reps: 12, loadKg: 40, endedAt: at(9))],
          ),
        ]),
      );
      expect(target, const Duration(seconds: 90));
    });

    test('is none when that exercise has none', () {
      final target = restTargetOf(
        workout([
          WorkoutExercise(
            exerciseId: 'back-squat',
            restTarget: const Duration(minutes: 3),
            sets: [WorkoutSet(reps: 8, loadKg: 100, endedAt: at(5))],
          ),
          WorkoutExercise(
            exerciseId: 'leg-curl',
            sets: [WorkoutSet(reps: 12, loadKg: 40, endedAt: at(9))],
          ),
        ]),
      );
      expect(target, isNull);
    });

    test('is none before any set has ended', () {
      expect(
        restTargetOf(
          workout(const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              restTarget: Duration(minutes: 3),
              sets: [WorkoutSet(reps: 8, loadKg: 100)],
            ),
          ]),
        ),
        isNull,
      );
    });
  });

  group('the rest target an exercise had last', () {
    test('comes from the most recently started workout with it', () {
      final target = lastRestTargetOf(
        exerciseId: 'back-squat',
        workouts: [
          workout(const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              restTarget: Duration(minutes: 2),
            ),
          ], startedAt: DateTime(2026, 10, 1, 18)),
          workout(
            const [
              WorkoutExercise(
                exerciseId: 'back-squat',
                restTarget: Duration(minutes: 3),
              ),
            ],
            id: 2,
            startedAt: DateTime(2026, 10, 3, 18),
          ),
          workout(
            const [
              WorkoutExercise(
                exerciseId: 'leg-curl',
                restTarget: Duration(minutes: 1),
              ),
            ],
            id: 3,
            startedAt: DateTime(2026, 10, 4, 18),
          ),
        ],
      );
      expect(target, const Duration(minutes: 3));
    });

    test('is none when it was turned off since', () {
      final target = lastRestTargetOf(
        exerciseId: 'back-squat',
        workouts: [
          workout(const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              restTarget: Duration(minutes: 2),
            ),
          ], startedAt: DateTime(2026, 10, 1, 18)),
          workout(
            const [WorkoutExercise(exerciseId: 'back-squat')],
            id: 2,
            startedAt: DateTime(2026, 10, 3, 18),
          ),
        ],
      );
      expect(target, isNull);
    });

    test('is none for an exercise never done', () {
      expect(lastRestTargetOf(exerciseId: 'dip', workouts: const []), isNull);
    });
  });

  group('a typed time of day', () {
    final began = DateTime(2026, 10, 5, 23, 30);
    final ended = DateTime(2026, 10, 6, 0, 40);

    DateTime place(int hour, int minute, [int second = 0]) => placeTimeOfDay(
      notBefore: began,
      notAfter: ended,
      timeOfDay: Duration(hours: hour, minutes: minute, seconds: second),
    );

    test('is on the day the workout began when it fits there', () {
      expect(place(23, 45, 10), DateTime(2026, 10, 5, 23, 45, 10));
      expect(place(23, 30), began);
    });

    test('is on the next day when the workout ran past midnight', () {
      expect(place(0, 20, 5), DateTime(2026, 10, 6, 0, 20, 5));
      expect(place(0, 40), ended);
    });

    test('is not moved to fit when it fits neither day', () {
      // 1:00 the next day is after the end; it stays on the first day,
      // where the caller refuses it as before the start.
      expect(place(1, 0), DateTime(2026, 10, 5, 1));
      expect(place(22, 0), DateTime(2026, 10, 5, 22));
    });

    test('is not put on the next day when that is half a day on', () {
      // 23:20 against a 23:30 start is a slip, not a 23 hour 50 minute
      // workout.
      final placed = placeTimeOfDay(
        notBefore: began,
        notAfter: DateTime(2026, 10, 7),
        timeOfDay: const Duration(hours: 23, minutes: 20),
      );
      expect(placed, DateTime(2026, 10, 5, 23, 20));
    });
  });
}
