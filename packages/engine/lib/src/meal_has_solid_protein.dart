import 'protein_spread_rule.dart';

/// Whether a meal with [proteinG] of protein carries the marker for someone
/// of [weightKg] (MM-125). No marker is not a failure and says nothing.
bool mealHasSolidProtein({
  required double proteinG,
  required double weightKg,
}) => weightKg > 0 && proteinG >= ProteinSpreadRule.markerGPerKg * weightKg;
