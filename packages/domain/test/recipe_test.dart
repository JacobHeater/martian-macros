import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-45: a recipe's serving is a share of the summed ingredients.
void main() {
  RecipeIngredient item(String name, double kcal, {double? grams}) =>
      RecipeIngredient(
        name: name,
        grams: grams,
        totals: NutritionTotals(
          kcal: kcal,
          proteinG: kcal / 20,
          carbsG: kcal / 10,
          fatG: kcal / 40,
        ),
      );

  test('one serving of a four-serving recipe is a quarter of the sum', () {
    final ingredients = [
      item('Chicken', 825, grams: 500),
      item('Rice', 1040, grams: 300),
      item('Oil', 177, grams: 20),
    ];
    final one = recipePerServing(ingredients, 4)!;
    expect(one.kcal, closeTo((825 + 1040 + 177) / 4, 1e-9));
    expect(one.proteinG, closeTo((825 + 1040 + 177) / 20 / 4, 1e-9));
  });

  test('servings must be above zero', () {
    expect(recipePerServing([item('x', 100)], 0), isNull);
    expect(recipePerServing([item('x', 100)], -1), isNull);
    expect(recipePerServing([item('x', 100)], double.nan), isNull);
  });

  test('a serving weighs the cooked weight over the servings, never raw', () {
    expect(recipeServingGrams(1200, 4), 300);
    expect(recipeServingGrams(null, 4), isNull);
    expect(recipeServingGrams(0, 4), isNull);
  });
}
