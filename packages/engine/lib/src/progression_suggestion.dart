import 'progression_kind.dart';

/// What to try for the first set of an exercise, and why (MM-79). It is
/// shown and pre-filled, never imposed.
final class ProgressionSuggestion {
  const ProgressionSuggestion({
    required this.kind,
    required this.loadKg,
    required this.reps,
    required this.lastLoadKg,
    required this.lastReps,
    required this.rangeTop,
  });

  final ProgressionKind kind;

  /// The load suggested, in the exercise's own meaning of load.
  final double loadKg;

  /// The reps suggested; for [ProgressionKind.addReps] it means that many
  /// or more.
  final int reps;

  /// Last session's top load, and the reps of each set done at it.
  final double lastLoadKg;
  final List<int> lastReps;

  /// The top of the rep range the suggestion was made within.
  final int rangeTop;
}
