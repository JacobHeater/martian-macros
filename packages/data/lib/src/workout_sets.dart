import 'package:drift/drift.dart';

/// The sets of a workout (MM-75). [exercisePosition] is the position of the
/// set's exercise in [WorkoutExercises].
@DataClassName('WorkoutSetRow')
class WorkoutSets extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get workoutId => integer()();
  IntColumn get exercisePosition => integer()();
  IntColumn get position => integer()();
  IntColumn get reps => integer().check(reps.isBiggerOrEqualValue(0))();

  /// Kilograms. Negative for assisted bodyweight work.
  RealColumn get loadKg => real()();

  /// Reps in reserve, 0 to 5; null when not recorded.
  IntColumn get rir => integer().nullable().check(rir.isBetweenValues(0, 5))();

  /// When the set began and ended, in milliseconds since the Unix epoch;
  /// null when not known (MM-191).
  IntColumn get startedAtMs => integer().nullable()();
  IntColumn get endedAtMs => integer().nullable()();
}
