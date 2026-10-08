import 'body_fat_estimate.dart';

/// Standard deviations that put a threshold at the 25th (or 75th) percentile
/// of a normal estimate: the point where the chance of being on the other
/// side is a quarter.
const double quartileSigmas = 0.6745;

/// How far the cautious body fat must move, in percentage points, before the
/// safety rules switch branch, in either direction (no flipping).
const double safetyBodyFatDeadbandPercent = 2;

/// The body-fat figure the safety thresholds are applied to (MM-132).
///
/// The loss limit, the protein rule and the energy-availability floor are all
/// stricter for leaner users, so each takes the stricter branch when the user
/// is plausibly on that side: when the chance of being at or under the
/// threshold is a quarter or more. That is the same as comparing the
/// threshold with the estimate less [quartileSigmas] standard deviations.
double cautiousBodyFatPercent(BodyFatEstimate estimate) =>
    (estimate.percent - quartileSigmas * estimate.sigmaPercent).clamp(
      2.0,
      70.0,
    );

/// [cautiousBodyFatPercent], held steady against small moves: the figure
/// changes only when the cautious value has moved more than
/// [safetyBodyFatDeadbandPercent] from [previous], the value used at the last
/// check-in. An estimate hovering at a threshold therefore cannot flip a rule
/// from one check-in to the next.
double safetyBodyFatPercent(BodyFatEstimate estimate, {double? previous}) {
  final cautious = cautiousBodyFatPercent(estimate);
  if (previous == null) return cautious;
  return (cautious - previous).abs() > safetyBodyFatDeadbandPercent
      ? cautious
      : previous;
}

/// Whether the user is clearly above [thresholdPercent]: the chance of being
/// under it is a quarter or less. For offers that need the user to be clearly
/// on one side, such as the fastest pace of loss.
bool bodyFatClearlyAbove(BodyFatEstimate estimate, double thresholdPercent) =>
    estimate.percent - quartileSigmas * estimate.sigmaPercent >=
    thresholdPercent;
