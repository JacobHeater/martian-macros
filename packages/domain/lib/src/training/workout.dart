import '../calendar_date.dart';
import 'workout_exercise.dart';

/// A training session: its exercises in order, each with its sets (MM-75).
final class Workout {
  const Workout({
    required this.id,
    required this.date,
    required this.startedAt,
    this.endedAt,
    this.exercises = const [],
  });

  /// Database id; 0 for one not yet saved.
  final int id;

  /// The day it counts toward.
  final CalendarDate date;
  final DateTime startedAt;

  /// Null while the workout is in progress.
  final DateTime? endedAt;
  final List<WorkoutExercise> exercises;

  bool get inProgress => endedAt == null;

  int get setCount =>
      exercises.fold(0, (sum, exercise) => sum + exercise.sets.length);

  Workout copyWith({
    int? id,
    DateTime? Function()? endedAt,
    List<WorkoutExercise>? exercises,
  }) => Workout(
    id: id ?? this.id,
    date: date,
    startedAt: startedAt,
    endedAt: endedAt == null ? this.endedAt : endedAt(),
    exercises: exercises ?? this.exercises,
  );
}
