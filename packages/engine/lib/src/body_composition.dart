import 'package:mm_domain/mm_domain.dart';

/// Body-fat percentage with a one-sigma uncertainty.
final class BodyFatEstimate {
  const BodyFatEstimate({required this.percent, required this.sigmaPercent});

  final double percent;
  final double sigmaPercent;

  /// Two-sigma bounds, clamped to a physiologically possible range.
  double get lowerPercent => (percent - 2 * sigmaPercent).clamp(2.0, 70.0);
  double get upperPercent => (percent + 2 * sigmaPercent).clamp(2.0, 70.0);

  double fatMassKg(double weightKg) => weightKg * percent / 100;

  /// Upper bound of fat-free mass. Safety floors use this so that
  /// uncertainty can never lower a floor.
  double fatFreeMassUpperKg(double weightKg) =>
      weightKg * (1 - lowerPercent / 100);
}

/// Deurenberg (1991) body-fat estimate from BMI, age, and sex.
///
/// Used only as a starting value when the user has no measurement; carries
/// a wide 5-point uncertainty.
BodyFatEstimate deurenbergBodyFat({
  required BiologicalSex sex,
  required double weightKg,
  required double heightCm,
  required int ageYears,
}) {
  final heightM = heightCm / 100;
  final bmi = weightKg / (heightM * heightM);
  final male = sex == BiologicalSex.male ? 1 : 0;
  final percent = 1.20 * bmi + 0.23 * ageYears - 10.8 * male - 5.4;
  return BodyFatEstimate(percent: percent.clamp(3.0, 60.0), sigmaPercent: 5);
}
