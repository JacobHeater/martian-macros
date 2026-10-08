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
