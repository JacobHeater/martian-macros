import 'exercise_progression_reader.dart';
import 'exercise_progression_writer.dart';

/// Reads and writes the rep ranges and load steps the user set (MM-79).
abstract interface class ExerciseProgressionRepository
    implements ExerciseProgressionReader, ExerciseProgressionWriter {}
