/// Kalman filter + Rauch-Tung-Striebel smoother over (level, slope, water).
///
/// A weigh-in is `level + water + noise`. Water is an AR(1) process: a salty
/// meal or a hard leg day raises it for a few days, then it decays. Modelling
/// it explicitly stops multi-day water swings being read as tissue change
/// and keeps the reported uncertainty honest. Noise scales with body weight.
/// Extra movement the trend is allowed on one day, beyond ordinary tissue
/// change: used on days when intake has just changed level.
final class TrendShift {
  const TrendShift({
    this.levelMeanKg = 0,
    required this.levelSigmaKg,
    required this.slopeSigmaKgPerDay,
  });

  final double levelMeanKg;
  final double levelSigmaKg;
  final double slopeSigmaKgPerDay;
}
