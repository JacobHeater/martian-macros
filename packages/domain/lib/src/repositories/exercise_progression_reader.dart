import '../training/exercise_progression.dart';

/// Reads the rep ranges and load steps the user set (MM-79).
abstract interface class ExerciseProgressionReader {
  /// Every one set, by exercise id, then the full list after each change.
  Stream<List<ExerciseProgression>> watchExerciseProgressions();
}
