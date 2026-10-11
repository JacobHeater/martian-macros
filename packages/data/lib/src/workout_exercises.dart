import 'package:drift/drift.dart';

/// The exercises of a workout, in order (MM-75). One may have no sets yet.
@DataClassName('WorkoutExerciseRow')
class WorkoutExercises extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get workoutId => integer()();
  IntColumn get position => integer()();

  /// The id of a built-in exercise or one of the user's own (MM-76).
  TextColumn get exerciseId => text()();

  /// The rest the user means to take after a set, if chosen (MM-191).
  IntColumn get restTargetSeconds => integer().nullable()();
}
