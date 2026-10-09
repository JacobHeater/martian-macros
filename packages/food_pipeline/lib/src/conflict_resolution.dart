import 'candidate_food.dart';

/// What to do when two sources describe the same barcode and both passed the
/// nutrition checks.
final class ConflictResolution {
  const ConflictResolution({required this.winner, required this.disagree});

  final CandidateFood winner;

  /// The two records differ by more than 10% (energy or a macro), so the
  /// food should be marked for the user to check.
  final bool disagree;
}
