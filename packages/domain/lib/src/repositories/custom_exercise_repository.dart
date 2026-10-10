import 'custom_exercise_reader.dart';
import 'custom_exercise_writer.dart';

/// Reads and writes the user's own exercises (MM-76).
abstract interface class CustomExerciseRepository
    implements CustomExerciseReader, CustomExerciseWriter {}
