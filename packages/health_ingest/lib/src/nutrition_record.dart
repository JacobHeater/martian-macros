/// What was eaten over a span of time, to be written to the platform
/// (MM-70), so the app is a good citizen of the user's health data.
final class NutritionRecord {
  const NutritionRecord({
    required this.id,
    required this.start,
    required this.end,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.name,
  });

  /// The app's own id for it, so writing it again replaces it.
  final String id;
  final DateTime start;
  final DateTime end;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final String? name;
}
