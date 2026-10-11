import 'package:mm_domain/mm_domain.dart';

import 'waist_rule.dart';

/// The noise figure for one waist measurement made as the middle of three
/// readings (MM-155): 1.0 cm to begin with. Once [WaistRule.personalAfter]
/// entries carry their three readings it is this user's own: the typical
/// spread of their readings within one sitting, never under 0.5 cm.
///
/// An entry of one reading is noisier still; see
/// [WaistRule.singleReadingFactor].
double waistNoiseOf(Iterable<WaistObservation> waist) {
  final spreads = [
    for (final entry in waist)
      if (entry.readings.length == 3)
        entry.readings.reduce((a, b) => a > b ? a : b) -
            entry.readings.reduce((a, b) => a < b ? a : b),
  ]..sort();
  if (spreads.length < WaistRule.personalAfter) {
    return WaistRule.medianOfThreeNoiseCm;
  }
  final mid = spreads.length ~/ 2;
  final typical = spreads.length.isOdd
      ? spreads[mid]
      : (spreads[mid - 1] + spreads[mid]) / 2;
  return typical < WaistRule.personalFloorCm
      ? WaistRule.personalFloorCm
      : typical;
}
