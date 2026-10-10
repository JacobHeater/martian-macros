import 'package:drift/drift.dart';

/// A training session (MM-75). Its exercises are in [WorkoutExercises] and
/// their sets in [WorkoutSets].
@DataClassName('WorkoutRow')
class Workouts extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get dateEpochDay => integer()();

  /// Milliseconds since the Unix epoch.
  IntColumn get startedAtMs => integer()();

  /// Null while the workout is in progress.
  IntColumn get endedAtMs => integer().nullable()();
}
