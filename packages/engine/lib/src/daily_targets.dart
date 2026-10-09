import 'target_flag.dart';

final class DailyTargets {
  const DailyTargets({
    required this.kcal,
    required this.proteinG,
    this.proteinMinimumG,
    required this.fatG,
    required this.carbsG,
    required this.weeklyRateFraction,
    this.flags = const {},
  });

  final double kcal;
  final double proteinG;
  final double? proteinMinimumG;
  final double fatG;
  final double carbsG;

  /// Intended body-weight change per week as a fraction of body weight
  /// (negative = loss).
  final double weeklyRateFraction;

  final Set<TargetFlag> flags;

  bool meetsProteinMinimum(double intakeProteinG) {
    final minimum = proteinMinimumG;
    return minimum != null && intakeProteinG >= minimum;
  }
}
