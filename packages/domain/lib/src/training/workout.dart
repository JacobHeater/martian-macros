import '../calendar_date.dart';
import 'workout_exercise.dart';

/// A training session: its exercises in order, each with its sets (MM-75).
final class Workout {
  const Workout({
    required this.id,
    required this.date,
    required this.startedAt,
    this.endedAt,
    this.setStartedAt,
    this.exercises = const [],
  });

  /// Database id; 0 for one not yet saved.
  final int id;

  /// The day it counts toward.
  final CalendarDate date;
  final DateTime startedAt;

  /// Null while the workout is in progress.
  final DateTime? endedAt;

  /// When the set timer was started, while a set is being timed (MM-191).
  /// The next set logged takes it as its start.
  final DateTime? setStartedAt;
  final List<WorkoutExercise> exercises;

  bool get inProgress => endedAt == null;

  int get setCount =>
      exercises.fold(0, (sum, exercise) => sum + exercise.sets.length);

  Workout copyWith({
    int? id,
    CalendarDate? date,
    DateTime? startedAt,
    DateTime? Function()? endedAt,
    DateTime? Function()? setStartedAt,
    List<WorkoutExercise>? exercises,
  }) => Workout(
    id: id ?? this.id,
    date: date ?? this.date,
    startedAt: startedAt ?? this.startedAt,
    endedAt: endedAt == null ? this.endedAt : endedAt(),
    setStartedAt: setStartedAt == null ? this.setStartedAt : setStartedAt(),
    exercises: exercises ?? this.exercises,
  );
}
