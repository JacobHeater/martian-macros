import '../../biological_sex.dart';
import '../portion/portion_unit.dart';
import 'hand_size.dart';

/// Turns a count of palms, cupped hands or thumbs into grams of a particular
/// food (MM-46).
///
/// **This is judgement, not measurement.** The reference volumes are rounded
/// from common coaching guidance (a palm of cooked protein is about 85 to
/// 115 g, a cupped hand about half a cup) and have not been checked against
/// measured hands. Hand length follows height, so volume follows height cubed
/// from a reference person of each sex. The result is only ever used with the
/// method's stated uncertainty (25%, 30%, 40%), and a steady bias is absorbed
/// by the adaptive estimate. Change a number here and raise [version].
abstract final class HandModel {
  /// Stored with a hand-portion entry so old entries stay explicable.
  static const version = 1;

  static const _referenceHeightCm = {
    BiologicalSex.male: 178.0,
    BiologicalSex.female: 165.0,
  };

  /// Millilitres of one portion at the reference height.
  static const _referenceMl = {
    PortionUnit.palm: {BiologicalSex.male: 110.0, BiologicalSex.female: 85.0},
    PortionUnit.cuppedHand: {
      BiologicalSex.male: 130.0,
      BiologicalSex.female: 100.0,
    },
    PortionUnit.thumb: {BiologicalSex.male: 15.0, BiologicalSex.female: 11.0},
  };

  /// Grams per millilitre to use when the food has no density of its own:
  /// cooked meat and fish are about 1.0, grains and fruit well under, fats
  /// about 0.9. This is what each portion is *for*.
  static const _defaultDensity = {
    PortionUnit.palm: 1.0,
    PortionUnit.cuppedHand: 0.65,
    PortionUnit.thumb: 0.9,
  };

  /// Volume of one [unit] for [hand], or null if [unit] is not a hand unit.
  static double? millilitersOf(PortionUnit unit, HandSize hand) {
    final reference = _referenceMl[unit]?[hand.sex];
    if (reference == null) return null;
    final scale = hand.heightCm / _referenceHeightCm[hand.sex]!;
    return reference * scale * scale * scale;
  }

  /// Grams in one [unit] of a food with [densityGPerMl] (or the portion's
  /// default when the food states none), or null if [unit] is not a hand unit.
  static double? gramsOf(
    PortionUnit unit,
    HandSize hand, {
    double? densityGPerMl,
  }) {
    final ml = millilitersOf(unit, hand);
    if (ml == null) return null;
    return ml * (densityGPerMl ?? _defaultDensity[unit]!);
  }
}
