import 'workout_reader.dart';
import 'workout_writer.dart';

/// Reads and writes workouts (MM-75).
abstract interface class WorkoutRepository
    implements WorkoutReader, WorkoutWriter {}
