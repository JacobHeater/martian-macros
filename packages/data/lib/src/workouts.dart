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

  /// When the clock was paused, while it is (MM-191).
  IntColumn get pausedAtMs => integer().nullable()();

  /// How long the clock has been paused in all, in milliseconds, not
  /// counting a pause still running.
  IntColumn get pausedForMs => integer().withDefault(const Constant(0))();

  /// When the set timer was started, while a set is being timed (MM-191).
  IntColumn get setStartedAtMs => integer().nullable()();
}
