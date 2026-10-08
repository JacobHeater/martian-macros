import 'package:mm_domain/mm_domain.dart';

import 'body_fat_estimate.dart';

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
