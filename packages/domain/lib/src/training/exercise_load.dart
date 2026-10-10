/// What the load logged for an exercise means (MM-76).
enum ExerciseLoad {
  /// The weight moved: the bar and plates, the dumbbell, the stack.
  addedWeight,

  /// The body is the load. What is logged is weight added to it, which may be
  /// zero, or negative for assisted work.
  bodyweight,
}
