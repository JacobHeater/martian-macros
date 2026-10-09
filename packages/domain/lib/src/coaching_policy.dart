import 'biological_sex.dart';
import 'body_mass_index.dart';
import 'calendar_date.dart';
import 'caution.dart';
import 'goal_mode.dart';
import 'profile.dart';
import 'screening_answers.dart';

/// What coaching the engine may offer, derived from profile and screening.
final class CoachingPolicy {
  static const seniorMinimumProteinGPerKgReferenceWeight = 1.2;
  static const seniorMaxWeeklyLossFraction = 0.005;
  static const insulinUnconfirmedMaxWeeklyLossFraction = 0.005;

  const CoachingPolicy._({
    required this.blocked,
    required this.allowedModes,
    this.maintenanceOffsetKcal = 0,
    this.proteinCapGPerKg,
    this.suppressWeightRewards = false,
    this.elevatedMuscleGainPrior = false,
    this.targetsAllowed = true,
    this.minimumProteinGPerKgReferenceWeight,
    this.underweight = false,
    this.maxWeeklyLossFraction,
    this.cautions = const {},
  });

  /// Derives the policy. Throws [ArgumentError] for answers that contradict
  /// biological sex (pregnancy, breastfeeding, PCOS, menopause for males).
  ///
  /// [weightKg] is the user's current (trend) weight. With it, a body mass
  /// index below [underweightBmi] removes the deficit goals, and one below
  /// [lowWeightCautionBmi] limits loss to the gentlest pace (MM-111).
  factory CoachingPolicy.derive({
    required Profile profile,
    required ScreeningAnswers screening,
    required CalendarDate today,
    double? weightKg,
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

    final bmi = weightKg == null
        ? null
        : bodyMassIndex(weightKg: weightKg, heightCm: profile.heightCm);
    final underweight = bmi != null && bmi < underweightBmi;
    final lowWeight = bmi != null && !underweight && bmi < lowWeightCautionBmi;
    final age = profile.ageOn(today);
    final maxLossLimits = [
      if (lowWeight) lowWeightMaxLossFraction,
      if (age >= 65) seniorMaxWeeklyLossFraction,
      if (s.insulinOrSulfonylurea && !s.insulinCareTeamConfirmed)
        insulinUnconfirmedMaxWeeklyLossFraction,
    ];
    final offered = underweight
        ? allowedModes.difference({GoalMode.fatLoss, GoalMode.recomp})
        : allowedModes;

    return CoachingPolicy._(
      blocked: false,
      allowedModes: offered,
      maintenanceOffsetKcal: s.breastfeeding ? 400 : 0,
      proteinCapGPerKg: s.chronicKidneyDisease ? 0.8 : null,
      minimumProteinGPerKgReferenceWeight: age >= 65
          ? seniorMinimumProteinGPerKgReferenceWeight
          : null,
      suppressWeightRewards: s.eatingDisorderHistory,
      elevatedMuscleGainPrior: s.androgenUse,
      targetsAllowed: !s.bariatricSurgery,
      underweight: underweight,
      maxWeeklyLossFraction: maxLossLimits.isEmpty
          ? null
          : maxLossLimits.reduce((a, b) => a < b ? a : b),
      cautions: {
        if (underweight) Caution.underweight,
        if (lowWeight) Caution.lowBodyWeight,
        if (s.pregnant) Caution.pregnancy,
        if (s.breastfeeding) Caution.breastfeeding,
        if (s.eatingDisorderHistory) Caution.eatingDisorderHistory,
        if (s.chronicKidneyDisease) Caution.chronicKidneyDisease,
        if (s.pcos) Caution.pcos,
        if (s.menopause) Caution.menopause,
        if (s.thyroidCondition) Caution.thyroidCondition,
        if (s.insulinOrSulfonylurea) Caution.insulinOrSulfonylurea,
        if (s.bariatricSurgery) Caution.bariatricSurgery,
        if (s.weightAffectingMedication) Caution.weightAffectingMedication,
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

  /// False when targets must be set by a user's surgical care team.
  final bool targetsAllowed;

  /// A lower bound for protein per kg of reference weight, when applicable.
  final double? minimumProteinGPerKgReferenceWeight;

  /// Body mass index is below 18.5: no deficit is planned (MM-111).
  final bool underweight;

  /// Upper limit on weekly loss, as a fraction of body weight; null when only
  /// the body-fat limit applies.
  final double? maxWeeklyLossFraction;

  final Set<Caution> cautions;
}
