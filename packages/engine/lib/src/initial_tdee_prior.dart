import 'tdee_prior.dart';

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
