import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-44: reading the US Nutrition Facts layout from recognised text.
void main() {
  const clean = '''
Nutrition Facts
8 servings per container
Serving size 2/3 cup (55g)
Amount per serving
Calories 230
% Daily Value*
Total Fat 8g 10%
Saturated Fat 1g 5%
Sodium 160mg 7%
Total Carbohydrate 37g 13%
Dietary Fiber 4g 14%
Total Sugars 12g
Protein 3g
''';

  test('a clean panel is read in full', () {
    final r = parseNutritionLabel(clean);
    expect(r.servingText, '2/3 cup (55g)');
    expect(r.servingGrams, 55);
    expect(r.kcal, 230);
    expect(r.fatG, 8);
    expect(r.carbsG, 37);
    expect(r.proteinG, 3);
    expect(r.fiberG, 4);
    expect(r.sodiumMg, 160);
  });

  test('calories from fat is not the calories', () {
    final r = parseNutritionLabel(
      'Calories from Fat 72\nCalories 230\nProtein 3g',
    );
    expect(r.kcal, 230);
  });

  test('a value on the line after its label is found', () {
    final r = parseNutritionLabel('Calories\n230\nTotal Fat\n8g\nProtein\n3g');
    expect(r.kcal, 230);
    expect(r.fatG, 8);
    expect(r.proteinG, 3);
  });

  test('the letter o read for a zero is repaired', () {
    final r = parseNutritionLabel('Calories 2O0\nTotal Fat 1o g\nProtein 5g');
    expect(r.kcal, 200);
    expect(r.fatG, 10);
  });

  test('what is missing stays null, never zero', () {
    final r = parseNutritionLabel('Calories 100\nProtein 2g');
    expect(r.carbsG, isNull);
    expect(r.fatG, isNull);
    expect(r.fiberG, isNull);
    expect(r.servingGrams, isNull);
  });

  test('text with no label is empty', () {
    expect(parseNutritionLabel('hello world').isEmpty, isTrue);
    expect(parseNutritionLabel('').isEmpty, isTrue);
  });
}
