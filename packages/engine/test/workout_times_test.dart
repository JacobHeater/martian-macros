import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-191: the rules for typed times, and when a rest began.
void main() {
  final six = DateTime(2026, 10, 5, 18);
  DateTime at(int minutes, [int seconds = 0]) =>
      six.add(Duration(minutes: minutes, seconds: seconds));

  group('typed times', () {
    test('a start and a later end are fine', () {
      expect(checkTimeSpan(start: at(2), end: at(3)), isNull);
    });

    test('either may be missing', () {
      expect(checkTimeSpan(end: at(3)), isNull);
      expect(checkTimeSpan(start: at(3)), isNull);
      expect(checkTimeSpan(), isNull);
    });

    test('an end at or before its start is refused', () {
      expect(
        checkTimeSpan(start: at(3), end: at(2)),
        TimeSpanProblem.endNotAfterStart,
      );
      expect(
        checkTimeSpan(start: at(3), end: at(3)),
        TimeSpanProblem.endNotAfterStart,
      );
    });

    test('a time outside the workout is refused', () {
      expect(
        checkTimeSpan(start: at(-1), end: at(3), notBefore: six),
        TimeSpanProblem.tooEarly,
      );
      expect(
        checkTimeSpan(start: at(2), end: at(61), notAfter: at(60)),
        TimeSpanProblem.tooLate,
      );
      expect(
        checkTimeSpan(end: at(61), notBefore: six, notAfter: at(60)),
        TimeSpanProblem.tooLate,
      );
    });

    test('the bounds themselves are allowed', () {
      expect(
        checkTimeSpan(
          start: six,
          end: at(60),
          notBefore: six,
          notAfter: at(60),
        ),
        isNull,
      );
    });
  });

  group('rest', () {
    Workout workout(List<WorkoutExercise> exercises) => Workout(
      id: 1,
      date: CalendarDate(2026, 10, 5),
      startedAt: six,
      exercises: exercises,
    );

    test('has not begun before any set has an end', () {
      expect(restStartedAt(workout(const [])), isNull);
      expect(
        restStartedAt(
          workout(const [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [WorkoutSet(reps: 8, loadKg: 100)],
            ),
          ]),
        ),
        isNull,
      );
    });

    test('begins when the most recently ended set ended', () {
      final started = restStartedAt(
        workout([
          WorkoutExercise(
            exerciseId: 'back-squat',
            sets: [
              WorkoutSet(reps: 8, loadKg: 100, endedAt: at(5)),
              WorkoutSet(reps: 8, loadKg: 100, endedAt: at(9, 30)),
            ],
          ),
          WorkoutExercise(
            exerciseId: 'pull-up',
            sets: [
              WorkoutSet(reps: 6, loadKg: 0, endedAt: at(7)),
              const WorkoutSet(reps: 6, loadKg: 0),
            ],
          ),
        ]),
      );
      expect(started, at(9, 30));
    });
  });
}
