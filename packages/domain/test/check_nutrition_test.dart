import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

NutritionPer100g food({
  String name = 'Food',
  double? kcal = 165,
  double? protein = 31,
  double? carbs = 0,
  double? fat = 3.6,
  double? fiber,
  double? alcohol,
}) => NutritionPer100g(
  name: name,
  kcal: kcal,
  proteinG: protein,
  carbsG: carbs,
  fatG: fat,
  fiberG: fiber,
  alcoholG: alcohol,
);

void main() {
  test('a sound entry is valid', () => expect(checkNutrition(food()), isNull));

  test('units entered wrongly: macros over 100 g', () {
    expect(
      checkNutrition(food(kcal: 52, protein: 300, carbs: 0, fat: 0)),
      NutritionProblem.macrosExceed100g,
    );
  });

  test('kilojoules entered as kilocalories', () {
    expect(
      checkNutrition(food(kcal: 690)),
      NutritionProblem.energyDisagreesWithMacros,
    );
  });

  test('a high-fiber food that only matches with fiber at 2 kcal', () {
    // 40 g carbohydrate of which 30 g fiber: 4*40 = 160 as stated, but
    // 4*10 + 2*30 = 100 with fiber at 2 kcal per gram.
    final f = food(kcal: 100, protein: 0, carbs: 40, fat: 0, fiber: 30);
    expect(checkNutrition(f), isNull);
    expect(
      checkNutrition(food(kcal: 100, protein: 0, carbs: 40, fat: 0)),
      NutritionProblem.energyDisagreesWithMacros,
      reason: 'without the fiber figure it does not match',
    );
  });

  test('water and diet drinks are valid', () {
    expect(checkNutrition(food(kcal: 0, protein: 0, carbs: 0, fat: 0)), isNull);
  });

  test('alcohol counts 7 kcal per gram', () {
    expect(
      checkNutrition(food(kcal: 70, protein: 0, carbs: 0, fat: 0, alcohol: 10)),
      isNull,
    );
  });

  test('the other reasons', () {
    expect(checkNutrition(food(name: ' ')), NutritionProblem.missingName);
    expect(checkNutrition(food(kcal: null)), NutritionProblem.missingValue);
    expect(checkNutrition(food(fat: null)), NutritionProblem.missingValue);
    expect(checkNutrition(food(carbs: -1)), NutritionProblem.negativeValue);
    expect(
      checkNutrition(food(kcal: 950, protein: 0, carbs: 0, fat: 100)),
      NutritionProblem.energyTooHigh,
    );
  });

  test('the typed-entry check is the same rule', () {
    expect(
      macrosMatchEnergy(kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6),
      isTrue,
    );
    expect(
      macrosMatchEnergy(kcal: 690, proteinG: 31, carbsG: 0, fatG: 3.6),
      isFalse,
    );
  });
}
