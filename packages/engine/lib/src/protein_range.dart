final class ProteinRange {
  const ProteinRange(this.minG, this.maxG);

  final double minG;
  final double maxG;

  double get midG => (minG + maxG) / 2;
}
