import 'target_flag.dart';

final class DailyTargets {
  const DailyTargets({
    required this.kcal,
    required this.proteinG,
    required this.fatG,
    required this.carbsG,
    required this.weeklyRateFraction,
    this.flags = const {},
  });

  final double kcal;
  final double proteinG;
  final double fatG;
  final double carbsG;

  /// Intended body-weight change per week as a fraction of body weight
  /// (negative = loss).
  final double weeklyRateFraction;

  final Set<TargetFlag> flags;
}
