/// Energy implied by macros (Atwater 4/4/9), plus alcohol at 7 kcal per gram.
double atwaterKcal({
  required double proteinG,
  required double carbsG,
  required double fatG,
  double alcoholG = 0,
}) => 4 * proteinG + 4 * carbsG + 9 * fatG + 7 * alcoholG;

/// Whether stated energy is consistent with stated macros: within the
/// larger of 15% or 20 kcal. Used to catch typos at entry time.
bool macrosMatchEnergy({
  required double kcal,
  required double proteinG,
  required double carbsG,
  required double fatG,
  double alcoholG = 0,
}) => energyAgreesWithMacros(
  kcal: kcal,
  proteinG: proteinG,
  carbsG: carbsG,
  fatG: fatG,
  alcoholG: alcoholG,
);

/// The single energy rule (MM-53): energy within the larger of 15% or 20 kcal
/// of what the macros imply, with alcohol at 7 kcal per gram.
///
/// US labels differ on whether carbohydrate includes fiber, and fiber counts
/// 2 kcal per gram, so it passes if energy matches any of: the macros as
/// stated, carbohydrate with its fiber at 2 instead of 4, or carbohydrate
/// that already excludes fiber with the fiber added at 2.
bool energyAgreesWithMacros({
  required double kcal,
  required double proteinG,
  required double carbsG,
  required double fatG,
  double fiberG = 0,
  double alcoholG = 0,
}) {
  final implied =
      atwaterKcal(proteinG: proteinG, carbsG: carbsG, fatG: fatG) +
      7 * alcoholG;
  final candidates = [implied, implied - 2 * fiberG, implied + 2 * fiberG];
  return candidates.any((c) {
    final tolerance = c * 0.15 > 20 ? c * 0.15 : 20.0;
    return (kcal - c).abs() <= tolerance;
  });
}
