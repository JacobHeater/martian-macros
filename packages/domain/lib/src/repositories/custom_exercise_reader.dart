import '../training/exercise.dart';

/// Reads the exercises the user added (MM-76).
abstract interface class CustomExerciseReader {
  /// Every exercise the user added, by name, then the full list after each
  /// change.
  Stream<List<Exercise>> watchCustomExercises();
}
