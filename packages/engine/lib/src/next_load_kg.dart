import 'package:mm_domain/mm_domain.dart';

/// One step up from [loadKg] for [exercise] (MM-79), or null when there is
/// no load to add to: a bodyweight exercise done with none.
///
/// The step is a round number in the user's own [units], since that is what
/// the plates and stacks come in: 2.5 kg or 5 lb, except a dumbbell (2 kg or
/// 5 lb) and a machine (5 kg or 10 lb). Assisted work, a load below zero,
/// takes 5 kg or 10 lb less help and never goes past none. These are
/// equipment conventions, not tested thresholds.
double? nextLoadKg({
  required Exercise? exercise,
  required UnitSystem units,
  required double loadKg,
}) {
  final imperial = units == UnitSystem.imperial;
  double step(double kg, double lb) => imperial ? Units.lbToKg(lb) : kg;
  if (exercise?.load == ExerciseLoad.bodyweight) {
    if (loadKg.abs() < 0.05) return null;
    if (loadKg < 0) {
      final less = loadKg + step(5, 10);
      return less > 0 ? 0 : less;
    }
    return loadKg + step(2.5, 5);
  }
  return loadKg +
      switch (exercise?.equipment) {
        Equipment.dumbbell => step(2, 5),
        Equipment.machine => step(5, 10),
        _ => step(2.5, 5),
      };
}
