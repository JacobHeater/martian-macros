/// The expenditure estimate a month ended on, with its uncertainty (MM-33).
final class ReportEstimate {
  const ReportEstimate({required this.kcal, required this.sigmaKcal});

  final double kcal;
  final double sigmaKcal;
}
