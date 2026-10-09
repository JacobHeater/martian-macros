/// How much nutrition to show (MM-49). It changes what is displayed, never
/// what is stored.
enum DetailLevel {
  /// Calories and protein.
  simple,

  /// Calories, protein, carbohydrate and fat.
  standard,

  /// Adds fiber, net carbohydrate, sodium and alcohol where known.
  full;

  bool get showsCarbsAndFat => this != simple;
  bool get showsExtras => this == full;
}
