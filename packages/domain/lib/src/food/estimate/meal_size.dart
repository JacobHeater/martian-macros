/// How big a meal was, for a rough estimate (MM-150). Sizes are shares of a
/// "regular" meal, which is a third of the user's maintenance expenditure.
/// The multipliers are judgement, set toward the top of the honest range
/// because large meals are systematically under-estimated.
enum MealSize {
  light(0.6),
  regular(1),
  large(1.5),
  veryLarge(2.2);

  const MealSize(this.multiplier);

  /// Times a regular meal.
  final double multiplier;
}
