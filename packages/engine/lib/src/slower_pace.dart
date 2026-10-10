import 'relief_rule.dart';

/// The fat-loss pace one step gentler than [current] (MM-117, MM-128), or
/// null when [current] is already the gentlest. Null [current] is the
/// default pace.
double? slowerPace(double? current) {
  final pace = current ?? ReliefRule.defaultPace;
  for (final option in ReliefRule.paces) {
    if (option < pace - 1e-9) return option;
  }
  return null;
}
