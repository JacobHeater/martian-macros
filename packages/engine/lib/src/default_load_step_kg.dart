import 'package:mm_domain/mm_domain.dart';

/// The step a load goes up by when the user has set none (MM-79): a round
/// number in their own [units], since that is what plates and stacks come
/// in. 2.5 kg or 5 lb, except a dumbbell (2 kg or 5 lb) and a machine
/// (5 kg or 10 lb); weight added to the body goes up by 2.5 kg or 5 lb
/// whatever it hangs from. Equipment conventions, not tested thresholds.
double defaultLoadStepKg({
  required Exercise? exercise,
  required UnitSystem units,
}) {
  double step(double kg, double lb) =>
      units == UnitSystem.imperial ? Units.lbToKg(lb) : kg;
  if (exercise?.load == ExerciseLoad.bodyweight) return step(2.5, 5);
  return switch (exercise?.equipment) {
    Equipment.dumbbell => step(2, 5),
    Equipment.machine => step(5, 10),
    _ => step(2.5, 5),
  };
}
