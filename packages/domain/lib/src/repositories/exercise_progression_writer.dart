import '../training/exercise_progression.dart';

/// Saves and clears the rep ranges and load steps the user set (MM-79).
abstract interface class ExerciseProgressionWriter {
  /// Sets it for its exercise, replacing any there.
  Future<void> saveExerciseProgression(ExerciseProgression progression);

  /// Goes back to the defaults for [exerciseId]. Does nothing if none is
  /// set.
  Future<void> clearExerciseProgression(String exerciseId);
}
