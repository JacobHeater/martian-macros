/// How the user wants suggestions made for one exercise (MM-79): the rep
/// range to work within and, if they chose one, the step to add load by.
/// An exercise without one uses the defaults.
final class ExerciseProgression {
  const ExerciseProgression({
    required this.exerciseId,
    required this.repsLow,
    required this.repsHigh,
    this.loadStepKg,
  }) : assert(repsLow >= 1 && repsLow < repsHigh, 'A range of at least two.'),
       assert(loadStepKg == null || loadStepKg > 0, 'A step above zero.');

  /// The most reps a range may run to.
  static const maxReps = 50;

  /// The [Exercise.id] it is for.
  final String exerciseId;

  /// The bottom and the top of the rep range.
  final int repsLow;
  final int repsHigh;

  /// What to add when every set reaches the top; null for the default step
  /// of the exercise's equipment.
  final double? loadStepKg;

  @override
  bool operator ==(Object other) =>
      other is ExerciseProgression &&
      other.exerciseId == exerciseId &&
      other.repsLow == repsLow &&
      other.repsHigh == repsHigh &&
      other.loadStepKg == loadStepKg;

  @override
  int get hashCode => Object.hash(exerciseId, repsLow, repsHigh, loadStepKg);
}
