import 'dart:math' as math;

/// Energy content of fat mass: 39.5 MJ/kg (Hall 2008).
const double fatMassKcalPerKg = 9440;

/// Energy content of fat-free mass: 7.6 MJ/kg (Hall 2008).
const double fatFreeMassKcalPerKg = 1815;

/// Forbes' constant: dFFM/dFM = C / FM (Hall 2007 revision of Forbes).
const double forbesConstantKg = 10.4;

/// Fraction of a body-weight change that is fat-free mass.
///
/// Uses the Forbes curve (leaner people lose proportionally more lean mass),
/// halved for resistance-trained users in a deficit, since training plus
/// adequate protein blunts lean-mass loss. The training adjustment is a
/// modelling assumption, not a fitted constant; revisit with simulator data.
double leanFractionOfChange({
  required double fatMassKg,
  required bool losing,
  required bool resistanceTrained,
}) {
  final fm = math.max(fatMassKg, 1.0);
  var p = forbesConstantKg / (forbesConstantKg + fm);
  if (losing && resistanceTrained) p *= 0.5;
  return p.clamp(0.0, 1.0);
}

/// Energy density of a weight change with lean fraction [leanFraction],
/// kcal per kg of body weight.
double energyDensityKcalPerKg(double leanFraction) =>
    leanFraction * fatFreeMassKcalPerKg + (1 - leanFraction) * fatMassKcalPerKg;

/// Energy density of the weight change implied by [slopeKgPerDay].
double energyDensityForSlope({
  required double slopeKgPerDay,
  required double fatMassKg,
  required bool resistanceTrained,
}) => energyDensityKcalPerKg(
  leanFractionOfChange(
    fatMassKg: fatMassKg,
    losing: slopeKgPerDay < 0,
    resistanceTrained: resistanceTrained,
  ),
);
