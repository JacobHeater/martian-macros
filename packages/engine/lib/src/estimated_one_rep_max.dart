import 'package:mm_domain/mm_domain.dart';

/// Epley with effective reps (reps + RIR). Null means insufficient evidence,
/// not zero strength. Bodyweight exercises use total resistance, not added load.
double? estimatedOneRepMax(
  WorkoutSet set, {
  required ExerciseLoad load,
  double? bodyweightKg,
}) {
  if (set.reps < 1 ||
      !set.loadKg.isFinite ||
      (set.rir != null && (set.rir! < 0 || set.rir! > WorkoutSet.maxRir))) {
    throw ArgumentError.value(set, 'set', 'Invalid reps, load or RIR.');
  }
  if (bodyweightKg != null && (!bodyweightKg.isFinite || bodyweightKg <= 0)) {
    throw ArgumentError.value(
      bodyweightKg,
      'bodyweightKg',
      'Must be positive and finite.',
    );
  }
  final effectiveReps = set.reps + (set.rir ?? 0);
  if (effectiveReps > 12 || set.rir == WorkoutSet.maxRir) return null;
  if (load == ExerciseLoad.bodyweight && bodyweightKg == null) return null;
  final resistance =
      set.loadKg + (load == ExerciseLoad.bodyweight ? bodyweightKg! : 0);
  if (resistance <= 0) return null;
  return resistance * (1 + effectiveReps / 30);
}
