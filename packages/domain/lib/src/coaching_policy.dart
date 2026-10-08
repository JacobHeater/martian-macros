import 'biological_sex.dart';
import 'calendar_date.dart';
import 'caution.dart';
import 'goal_mode.dart';
import 'profile.dart';
import 'screening_answers.dart';

/// What coaching the engine may offer, derived from profile and screening.
final class CoachingPolicy {
  const CoachingPolicy._({
    required this.blocked,
    required this.allowedModes,
    this.maintenanceOffsetKcal = 0,
    this.proteinCapGPerKg,
    this.suppressWeightRewards = false,
    this.elevatedMuscleGainPrior = false,
    this.cautions = const {},
  });

  /// Derives the policy. Throws [ArgumentError] for answers that contradict
  /// biological sex (pregnancy, breastfeeding, PCOS, menopause for males).
  factory CoachingPolicy.derive({
    required Profile profile,
    required ScreeningAnswers screening,
    required CalendarDate today,
  }) {
    final s = screening;
    if (profile.sex == BiologicalSex.male &&
        (s.pregnant || s.breastfeeding || s.pcos || s.menopause)) {
      throw ArgumentError('Female-only screening answer for a male profile');
    }

    if (!profile.isAdultOn(today)) {
      return const CoachingPolicy._(blocked: true, allowedModes: {});
    }

    // Pregnancy and lactation: maintenance only. Eating-disorder history: no
    // deficit modes, and no weight-based rewards anywhere in the UI.
    final Set<GoalMode> allowedModes;
    if (s.pregnant || s.breastfeeding) {
      allowedModes = {GoalMode.maintenance};
    } else if (s.eatingDisorderHistory) {
      allowedModes = {GoalMode.maintenance, GoalMode.leanGain};
    } else {
      allowedModes = GoalMode.values.toSet();
    }

    return CoachingPolicy._(
      blocked: false,
      allowedModes: allowedModes,
      maintenanceOffsetKcal: s.breastfeeding ? 400 : 0,
      proteinCapGPerKg: s.chronicKidneyDisease ? 0.8 : null,
      suppressWeightRewards: s.eatingDisorderHistory,
      elevatedMuscleGainPrior: s.androgenUse,
      cautions: {
        if (s.pregnant) Caution.pregnancy,
        if (s.breastfeeding) Caution.breastfeeding,
        if (s.eatingDisorderHistory) Caution.eatingDisorderHistory,
        if (s.chronicKidneyDisease) Caution.chronicKidneyDisease,
        if (s.pcos) Caution.pcos,
        if (s.menopause) Caution.menopause,
        if (s.thyroidCondition) Caution.thyroidCondition,
      },
    );
  }

  /// True when the user may not receive coaching at all (under 18).
  final bool blocked;

  final Set<GoalMode> allowedModes;

  /// Added to every calorie target (lactation energy cost).
  final double maintenanceOffsetKcal;

  /// Upper limit on protein, g per kg body weight; null when uncapped.
  final double? proteinCapGPerKg;

  final bool suppressWeightRewards;
  final bool elevatedMuscleGainPrior;

  final Set<Caution> cautions;
}
