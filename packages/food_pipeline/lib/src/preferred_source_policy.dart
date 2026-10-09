import 'candidate_food.dart';
import 'conflict_policy.dart';
import 'conflict_resolution.dart';

/// The record from [preferredSource] wins, and when the two differ by more
/// than 10% the result is flagged so it can carry the "check this" tier
/// instead of passing as certain. A record that fails the nutrition checks
/// never reaches this point, so "the consistent one wins" is already true.
final class PreferredSourcePolicy implements ConflictPolicy {
  const PreferredSourcePolicy(this.preferredSource);

  final String preferredSource;

  @override
  ConflictResolution resolve(CandidateFood first, CandidateFood second) {
    final winner =
        second.source == preferredSource && first.source != second.source
        ? second
        : first;
    return ConflictResolution(winner: winner, disagree: differ(first, second));
  }

  /// Whether two records differ by more than 10% in energy or a macro.
  static bool differ(CandidateFood a, CandidateFood b) {
    bool far(double? x, double? y, double floor) {
      if (x == null || y == null) return false;
      final larger = x > y ? x : y;
      final tolerance = larger * 0.10 > floor ? larger * 0.10 : floor;
      return (x - y).abs() > tolerance;
    }

    return far(a.kcal, b.kcal, 10) ||
        far(a.proteinG, b.proteinG, 1) ||
        far(a.carbsG, b.carbsG, 1) ||
        far(a.fatG, b.fatG, 1);
  }
}
