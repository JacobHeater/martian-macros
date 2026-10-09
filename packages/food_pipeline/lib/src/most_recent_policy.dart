import 'candidate_food.dart';
import 'conflict_policy.dart';
import 'conflict_resolution.dart';
import 'preferred_source_policy.dart';

/// The record the source changed most recently wins; on a tie, or when neither
/// says, [tieBreak] decides. Differences of more than 10% still mark the food
/// for the user to check.
///
/// This is the rule from MM-51: a record that fails the nutrition checks never
/// gets here, so only two consistent records are compared, and then the
/// fresher one is the better guess.
final class MostRecentPolicy implements ConflictPolicy {
  const MostRecentPolicy({required this.tieBreak});

  /// The source that wins when the records are equally recent.
  final String tieBreak;

  @override
  ConflictResolution resolve(CandidateFood first, CandidateFood second) {
    final disagree = PreferredSourcePolicy.differ(first, second);
    if (first.updatedAt != second.updatedAt) {
      final newer = second.updatedAt > first.updatedAt ? second : first;
      return ConflictResolution(winner: newer, disagree: disagree);
    }
    return PreferredSourcePolicy(tieBreak).resolve(first, second);
  }
}
