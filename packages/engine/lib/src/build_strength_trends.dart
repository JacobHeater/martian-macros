import 'package:mm_domain/mm_domain.dart';

import 'estimated_one_rep_max.dart';
import 'strength_point.dart';
import 'strength_trend.dart';

/// Recomputable, deterministic strength histories. No weights or sets are
/// invented; a trailing mean softens one bad session without predicting a max.
List<StrengthTrend> buildStrengthTrends({
  required Iterable<Workout> workouts,
  required Iterable<Exercise> exercises,
  required Iterable<WeightObservation> weights,
  required CalendarDate today,
}) {
  final finished =
      workouts
          .where(
            (workout) => !workout.inProgress && !workout.date.isAfter(today),
          )
          .toList()
        ..sort((a, b) {
          final date = a.date.compareTo(b.date);
          if (date != 0) return date;
          final time = a.startedAt.compareTo(b.startedAt);
          return time != 0 ? time : a.id.compareTo(b.id);
        });
  final readings = weights.toList()..sort((a, b) => a.date.compareTo(b.date));
  final result = <StrengthTrend>[];
  final byId = {for (final exercise in exercises) exercise.id: exercise};
  final exerciseIds = {
    for (final workout in finished)
      for (final entry in workout.exercises) entry.exerciseId,
  };
  for (final exerciseId in exerciseIds) {
    final exercise = byId[exerciseId];
    final points = <StrengthPoint>[];
    var loggedSessions = 0;
    var recentSessions = 0;
    for (final workout in finished) {
      final sets = [
        for (final entry in workout.exercises)
          if (entry.exerciseId == exerciseId) ...entry.sets,
      ];
      if (sets.isEmpty) continue;
      loggedSessions++;
      if (exercise == null) continue;
      double? bodyweightKg;
      for (final reading in readings) {
        if (!reading.date.isAfter(workout.date) &&
            reading.date.daysUntil(workout.date) <= 7) {
          bodyweightKg = reading.weightKg;
        }
      }
      double? best;
      for (final set in sets) {
        final estimate = estimatedOneRepMax(
          set,
          load: exercise.load,
          bodyweightKg: bodyweightKg,
        );
        if (estimate != null && (best == null || estimate > best)) {
          best = estimate;
        }
      }
      if (best == null) continue;
      if (workout.date.daysUntil(today) < 90) recentSessions++;
      final window = points
          .where((point) => point.date.daysUntil(workout.date) <= 28)
          .toList();
      final previous = window.skip(window.length > 2 ? window.length - 2 : 0);
      final values = [...previous.map((point) => point.estimateKg), best];
      points.add(
        StrengthPoint(
          workoutId: workout.id,
          date: workout.date,
          estimateKg: best,
          trendKg: values.reduce((a, b) => a + b) / values.length,
        ),
      );
    }
    if (loggedSessions > 0) {
      result.add(
        StrengthTrend(
          exercise: exercise,
          exerciseId: exerciseId,
          points: List.unmodifiable(points),
          loggedSessions: loggedSessions,
          recentSessions: recentSessions,
        ),
      );
    }
  }
  result.sort((a, b) {
    final count = b.recentSessions.compareTo(a.recentSessions);
    if (count != 0) return count;
    if (a.points.isNotEmpty && b.points.isNotEmpty) {
      final latest = b.points.last.date.compareTo(a.points.last.date);
      if (latest != 0) return latest;
    } else if (a.points.isEmpty != b.points.isEmpty) {
      return a.points.isEmpty ? 1 : -1;
    }
    return a.exerciseId.compareTo(b.exerciseId);
  });
  return List.unmodifiable(result);
}
