import 'calorie_band.dart';
import 'intake_standing.dart';

/// The standing of [kcal] against [targetKcal]. An intake below [floorKcal],
/// the lowest the app would ever suggest, is [IntakeStanding.belowFloor]
/// whatever the band says (MM-114, MM-149).
IntakeStanding intakeStandingOf({
  required double kcal,
  required double targetKcal,
  double? floorKcal,
}) {
  if (floorKcal != null && kcal < floorKcal) return IntakeStanding.belowFloor;
  final band = CalorieBand(targetKcal);
  if (band.contains(kcal)) return IntakeStanding.onTarget;
  return kcal < band.lowKcal ? IntakeStanding.below : IntakeStanding.above;
}
