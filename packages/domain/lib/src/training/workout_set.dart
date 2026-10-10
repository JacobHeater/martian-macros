/// One set of an exercise (MM-75).
final class WorkoutSet {
  const WorkoutSet({required this.reps, required this.loadKg, this.rir});

  final int reps;

  /// The weight moved, in kilograms. For a bodyweight exercise it is the
  /// weight added to the body: zero, or negative for assisted work.
  final double loadKg;

  /// Reps in reserve, 0 to [maxRir], where [maxRir] means that many or more.
  /// Null when it was not recorded.
  final int? rir;

  /// The highest reps in reserve recorded; it stands for "5 or more".
  static const maxRir = 5;

  WorkoutSet copyWith({int? reps, double? loadKg, int? Function()? rir}) =>
      WorkoutSet(
        reps: reps ?? this.reps,
        loadKg: loadKg ?? this.loadKg,
        rir: rir == null ? this.rir : rir(),
      );
}
