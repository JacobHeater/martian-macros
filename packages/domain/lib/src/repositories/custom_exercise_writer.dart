import '../training/exercise.dart';

/// Saves and deletes the exercises the user added (MM-76).
abstract interface class CustomExerciseWriter {
  /// Saves [exercise]: a new one when its id is empty, otherwise a
  /// replacement of the one with that id. Returns its id, which starts with
  /// [Exercise.customIdPrefix]. Sets already logged against it are not
  /// touched.
  Future<String> saveCustomExercise(Exercise exercise);

  /// Removes the exercise with [id]. Does nothing if there is none. Sets
  /// logged against it keep its id.
  Future<void> deleteCustomExercise(String id);
}
