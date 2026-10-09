import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-150: rough meal estimates scaled to the user's maintenance.
void main() {
  test('sizes scale a third of maintenance, rounded to 50 kcal', () {
    expect(mealKcal(MealSize.regular, 2700), 900);
    expect(mealKcal(MealSize.light, 2700), 550);
    expect(mealKcal(MealSize.large, 2700), 1350);
    expect(mealKcal(MealSize.veryLarge, 2700), 2000);
  });

  test('a regular balanced meal is about 900 kcal with a balanced split', () {
    final t = estimateMeal(
      MealSize.regular,
      MealKind.balanced,
      maintenanceKcal: 2700,
    );
    expect(t.kcal, 900);
    expect(t.proteinG, closeTo(45, 1e-9));
    expect(t.carbsG, closeTo(112.5, 1e-9));
    expect(t.fatG, closeTo(30, 1e-9));
  });

  test('every kind adds to the meal energy', () {
    for (final kind in MealKind.values) {
      expect(kind.protein + kind.carbs + kind.fat, closeTo(1, 1e-12));
      final t = estimateMeal(MealSize.large, kind, maintenanceKcal: 2400);
      expect(4 * t.proteinG + 4 * t.carbsG + 9 * t.fatG, closeTo(t.kcal, 1e-9));
    }
  });
}
