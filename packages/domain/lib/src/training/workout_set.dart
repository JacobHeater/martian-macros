/// One set of an exercise (MM-75).
final class WorkoutSet {
  const WorkoutSet({
    required this.reps,
    required this.loadKg,
    this.rir,
    this.startedAt,
    this.endedAt,
  });

  final int reps;

  /// The weight moved, in kilograms. For a bodyweight exercise it is the
  /// weight added to the body: zero, or negative for assisted work.
  final double loadKg;

  /// Reps in reserve, 0 to [maxRir], where [maxRir] means that many or more.
  /// Null when it was not recorded.
  final int? rir;

  /// When the set began and ended (MM-191). Either may be unknown: a set
  /// logged without the set timer has an end and no start, and a set logged
  /// afterwards may have neither. Never invented.
  final DateTime? startedAt;
  final DateTime? endedAt;

  /// The highest reps in reserve recorded; it stands for "5 or more".
  static const maxRir = 5;

  /// How long the set took, when both times are known.
  Duration? get duration {
    final start = startedAt;
    final end = endedAt;
    return start == null || end == null ? null : end.difference(start);
  }

  WorkoutSet copyWith({
    int? reps,
    double? loadKg,
    int? Function()? rir,
    DateTime? Function()? startedAt,
    DateTime? Function()? endedAt,
  }) => WorkoutSet(
    reps: reps ?? this.reps,
    loadKg: loadKg ?? this.loadKg,
    rir: rir == null ? this.rir : rir(),
    startedAt: startedAt == null ? this.startedAt : startedAt(),
    endedAt: endedAt == null ? this.endedAt : endedAt(),
  );
}
