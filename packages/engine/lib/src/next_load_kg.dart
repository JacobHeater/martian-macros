import 'package:mm_domain/mm_domain.dart';

import 'default_load_step_kg.dart';

/// One step up from [loadKg] for [exercise] (MM-79), or null when there is
/// no load to add to: a bodyweight exercise done with none.
///
/// The step is [stepKg] when the user set one, otherwise
/// [defaultLoadStepKg]. Assisted work, a load below zero, takes twice the
/// default step less help (5 kg or 10 lb), or the user's own step, and
/// never goes past none.
double? nextLoadKg({
  required Exercise? exercise,
  required UnitSystem units,
  required double loadKg,
  double? stepKg,
}) {
  final usual = defaultLoadStepKg(exercise: exercise, units: units);
  if (exercise?.load == ExerciseLoad.bodyweight) {
    if (loadKg.abs() < 0.05) return null;
    if (loadKg < 0) {
      final less = loadKg + (stepKg ?? usual * 2);
      return less > 0 ? 0 : less;
    }
  }
  return loadKg + (stepKg ?? usual);
}
