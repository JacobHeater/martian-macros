/// The calorie target at each stage of `computeTargets`, so a change can be
/// explained stage by stage (MM-138).
final class TargetsTrace {
  const TargetsTrace({
    required this.formulaKcal,
    required this.limitedKcal,
    required this.heldKcal,
    required this.raisedKcal,
    required this.finalKcal,
  });

  /// Expenditure plus the pace's energy, before any limit.
  final double formulaKcal;

  /// After the weekly step limit (equal to [formulaKcal] with no previous
  /// targets, or when a safety rule exempts the change).
  final double limitedKcal;

  /// After holding a target that a safety raise lifted last week.
  final double heldKcal;

  /// After a safety raise for a too-fast loss.
  final double raisedKcal;

  /// After the calorie floor: what was issued.
  final double finalKcal;
}
