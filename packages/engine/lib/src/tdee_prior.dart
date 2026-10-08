/// A TDEE value with one-sigma uncertainty.
final class TdeePrior {
  const TdeePrior({required this.kcal, required this.sigmaKcal});

  final double kcal;
  final double sigmaKcal;
}
