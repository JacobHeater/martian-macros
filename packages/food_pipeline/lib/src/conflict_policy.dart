import 'candidate_food.dart';
import 'conflict_resolution.dart';

/// The rule for two sources that both have a barcode (MM-51). Which source
/// wins is the product owner's decision, so it is a parameter.
abstract interface class ConflictPolicy {
  ConflictResolution resolve(CandidateFood first, CandidateFood second);
}
