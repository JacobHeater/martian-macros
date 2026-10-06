import 'package:mm_domain/mm_domain.dart';

enum ModeReason {
  /// Policy forbids deficits (screening).
  deficitNotAllowed,

  /// Body fat high enough that faster visible loss matters most.
  highBodyFat,

  /// Novice, returning, or high body fat: recomp is realistic (Barakat 2020).
  recompEligible,

  /// Lean and trained: building needs a surplus.
  leanAndTrained,

  /// Default: trained, moderate body fat, so cut first.
  cutFirst,
}

final class ModeRecommendation {
  const ModeRecommendation(this.mode, this.reason);

  final GoalMode mode;
  final ModeReason reason;
}

/// Recommends a starting mode. The user may pick any mode the policy
/// allows; this only decides the default and the onboarding copy.
///
/// The body-fat cut-offs are product heuristics informed by Barakat et al.
/// (2020), not thresholds from the literature.
ModeRecommendation recommendMode({
  required BiologicalSex sex,
  required double bodyFatPercent,
  required TrainingStatus trainingStatus,
  required CoachingPolicy policy,
}) {
  if (!policy.allowedModes.contains(GoalMode.fatLoss)) {
    return const ModeRecommendation(
      GoalMode.maintenance,
      ModeReason.deficitNotAllowed,
    );
  }

  final (lean, recompHigh, veryHigh) = switch (sex) {
    BiologicalSex.male => (15.0, 20.0, 25.0),
    BiologicalSex.female => (23.0, 30.0, 35.0),
  };
  final bf = bodyFatPercent;

  if (bf >= veryHigh) {
    return const ModeRecommendation(GoalMode.fatLoss, ModeReason.highBodyFat);
  }
  final earlyTraining = switch (trainingStatus) {
    TrainingStatus.untrained ||
    TrainingStatus.novice ||
    TrainingStatus.returning => true,
    _ => false,
  };
  if (earlyTraining || bf >= recompHigh) {
    return const ModeRecommendation(GoalMode.recomp, ModeReason.recompEligible);
  }
  if (bf <= lean) {
    return const ModeRecommendation(
      GoalMode.leanGain,
      ModeReason.leanAndTrained,
    );
  }
  return const ModeRecommendation(GoalMode.fatLoss, ModeReason.cutFirst);
}
