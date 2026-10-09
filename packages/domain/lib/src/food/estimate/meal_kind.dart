/// What a roughly estimated meal was mostly made of, which sets its macro
/// split by share of energy (MM-150). The splits are judgement, not data.
enum MealKind {
  /// A bit of everything.
  balanced(protein: 0.20, carbs: 0.50, fat: 0.30),

  /// Pasta, rice, pizza.
  mostlyCarbohydrate(protein: 0.15, carbs: 0.65, fat: 0.20),

  /// Meat or fish with vegetables.
  mostlyProtein(protein: 0.35, carbs: 0.30, fat: 0.35),

  /// Fried, creamy or dessert-heavy.
  rich(protein: 0.12, carbs: 0.38, fat: 0.50);

  const MealKind({
    required this.protein,
    required this.carbs,
    required this.fat,
  });

  /// Shares of the meal's energy; they add to one.
  final double protein;
  final double carbs;
  final double fat;
}
