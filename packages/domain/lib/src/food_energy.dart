/// Energy implied by macros (Atwater 4/4/9).
double atwaterKcal({
  required double proteinG,
  required double carbsG,
  required double fatG,
}) => 4 * proteinG + 4 * carbsG + 9 * fatG;

/// Whether stated energy is consistent with stated macros: within the
/// larger of 15% or 20 kcal. Used to catch typos at entry time.
bool macrosMatchEnergy({
  required double kcal,
  required double proteinG,
  required double carbsG,
  required double fatG,
}) {
  final implied = atwaterKcal(proteinG: proteinG, carbsG: carbsG, fatG: fatG);
  final tolerance = implied * 0.15 > 20 ? implied * 0.15 : 20.0;
  return (kcal - implied).abs() <= tolerance;
}
