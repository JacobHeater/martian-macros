import '../calendar_date.dart';
import 'workout_exercise.dart';

/// A training session: its exercises in order, each with its sets (MM-75).
final class Workout {
  const Workout({
    required this.id,
    required this.date,
    required this.startedAt,
    this.endedAt,
    this.pausedAt,
    this.pausedFor = Duration.zero,
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

  /// When the clock was paused, while it is (MM-191).
  final DateTime? pausedAt;

  /// How long the clock has been paused in all, not counting a pause that is
  /// still running.
  final Duration pausedFor;

  /// When the set timer was started, while a set is being timed (MM-191).
  /// The next set logged takes it as its start.
  final DateTime? setStartedAt;
  final List<WorkoutExercise> exercises;

  bool get inProgress => endedAt == null;

  bool get paused => pausedAt != null;

  int get setCount =>
      exercises.fold(0, (sum, exercise) => sum + exercise.sets.length);

  /// How long the workout has run as of [now], leaving out the time its
  /// clock was paused. For a finished workout [now] does not matter.
  Duration activeFor(DateTime now) {
    final until = endedAt ?? pausedAt ?? now;
    final active = until.difference(startedAt) - pausedFor;
    return active.isNegative ? Duration.zero : active;
  }

  Workout copyWith({
    int? id,
    CalendarDate? date,
    DateTime? startedAt,
    DateTime? Function()? endedAt,
    DateTime? Function()? pausedAt,
    Duration? pausedFor,
    DateTime? Function()? setStartedAt,
    List<WorkoutExercise>? exercises,
  }) => Workout(
    id: id ?? this.id,
    date: date ?? this.date,
    startedAt: startedAt ?? this.startedAt,
    endedAt: endedAt == null ? this.endedAt : endedAt(),
    pausedAt: pausedAt == null ? this.pausedAt : pausedAt(),
    pausedFor: pausedFor ?? this.pausedFor,
    setStartedAt: setStartedAt == null ? this.setStartedAt : setStartedAt(),
    exercises: exercises ?? this.exercises,
  );
}
