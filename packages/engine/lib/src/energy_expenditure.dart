import 'package:mm_domain/mm_domain.dart';

/// Mifflin-St Jeor resting energy expenditure, kcal/day.
double mifflinStJeorKcal({
  required BiologicalSex sex,
  required double weightKg,
  required double heightCm,
  required int ageYears,
}) {
  final base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return switch (sex) {
    BiologicalSex.male => base + 5,
    BiologicalSex.female => base - 161,
  };
}

/// Katch-McArdle resting energy expenditure from fat-free mass, kcal/day.
/// Preferred over Mifflin once body composition has converged.
double katchMcArdleKcal({required double fatFreeMassKg}) =>
    370 + 21.6 * fatFreeMassKg;

/// A TDEE value with one-sigma uncertainty.
final class TdeePrior {
  const TdeePrior({required this.kcal, required this.sigmaKcal});

  final double kcal;
  final double sigmaKcal;
}

/// Starting TDEE before any adaptive data: BMR times a deliberately
/// conservative activity factor, with a wide (15%) uncertainty that the
/// estimator quickly overrides.
TdeePrior initialTdeePrior({
  required double bmrKcal,
  required int trainingDaysPerWeek,
}) {
  final factor = switch (trainingDaysPerWeek) {
    <= 2 => 1.35,
    <= 4 => 1.45,
    _ => 1.55,
  };
  final kcal = bmrKcal * factor;
  return TdeePrior(kcal: kcal, sigmaKcal: kcal * 0.15);
}
