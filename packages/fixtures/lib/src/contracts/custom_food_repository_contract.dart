import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

CustomFood _food(
  String name, {
  int id = 0,
  double kcal = 120,
  String? barcode,
}) => CustomFood(
  id: id,
  name: name,
  kind: CustomFoodKind.food,
  servingDescription: '1 bar',
  servingGrams: 30,
  perServing: NutritionTotals(kcal: kcal, proteinG: 10, carbsG: 12, fatG: 4),
  barcode: barcode,
);

/// What every [CustomFoodRepository] must do (MM-45).
void customFoodRepositoryContract(
  String name,
  CustomFoodRepository Function() create,
) {
  group('$name as a CustomFoodRepository', () {
    late CustomFoodRepository repo;

    setUp(() => repo = create());

    test('starts empty', () async {
      expect(await repo.watchCustomFoods().first, isEmpty);
    });

    test('a saved food is read back with its fields, by name', () async {
      final b = await repo.saveCustomFood(
        _food('Bar', barcode: '00012345678905'),
      );
      final a = await repo.saveCustomFood(_food('Apple'));
      expect(b, greaterThan(0));
      expect(a, greaterThan(b));
      final list = await repo.watchCustomFoods().first;
      expect([for (final f in list) f.name], ['Apple', 'Bar']);
      final bar = list.last;
      expect(bar.id, b);
      expect(bar.kind, CustomFoodKind.food);
      expect(bar.servingDescription, '1 bar');
      expect(bar.servingGrams, 30);
      expect(bar.perServing.kcal, 120);
      expect(bar.perServing.proteinG, 10);
      expect(bar.barcode, '00012345678905');
    });

    test('saving with an id replaces that food', () async {
      final id = await repo.saveCustomFood(_food('Bar'));
      await repo.saveCustomFood(_food('Bar', id: id, kcal: 150));
      final list = await repo.watchCustomFoods().first;
      expect(list, hasLength(1));
      expect(list.single.perServing.kcal, 150);
    });

    test('a recipe keeps its ingredients in order', () async {
      final id = await repo.saveCustomFood(
        const CustomFood(
          id: 0,
          name: 'Chili',
          kind: CustomFoodKind.recipe,
          servingDescription: '1 bowl',
          servingGrams: 300,
          perServing: NutritionTotals(
            kcal: 500,
            proteinG: 40,
            carbsG: 50,
            fatG: 15,
          ),
          servings: 4,
          cookedWeightGrams: 1200,
          ingredients: [
            RecipeIngredient(
              name: 'Beef',
              grams: 500,
              totals: NutritionTotals(
                kcal: 1250,
                proteinG: 100,
                carbsG: 0,
                fatG: 90,
              ),
            ),
            RecipeIngredient(
              name: 'Beans',
              totals: NutritionTotals(
                kcal: 750,
                proteinG: 50,
                carbsG: 130,
                fatG: 5,
              ),
            ),
          ],
        ),
      );
      final chili = (await repo.watchCustomFoods().first).single;
      expect(chili.id, id);
      expect(chili.kind, CustomFoodKind.recipe);
      expect(chili.servings, 4);
      expect(chili.cookedWeightGrams, 1200);
      expect([for (final i in chili.ingredients) i.name], ['Beef', 'Beans']);
      expect(chili.ingredients.first.grams, 500);
      expect(chili.ingredients.last.grams, isNull);
      expect(chili.ingredients.first.totals.kcal, 1250);

      // Replacing it replaces its ingredients, not adds to them.
      await repo.saveCustomFood(
        CustomFood(
          id: id,
          name: 'Chili',
          kind: CustomFoodKind.recipe,
          servingDescription: '1 bowl',
          perServing: chili.perServing,
          servings: 4,
          ingredients: [chili.ingredients.first],
        ),
      );
      final again = (await repo.watchCustomFoods().first).single;
      expect(again.ingredients, hasLength(1));
      expect(again.servingGrams, isNull);
    });

    test('delete removes a food; a missing id does nothing', () async {
      final id = await repo.saveCustomFood(_food('Bar'));
      await repo.deleteCustomFood(id + 100);
      expect(await repo.watchCustomFoods().first, hasLength(1));
      await repo.deleteCustomFood(id);
      expect(await repo.watchCustomFoods().first, isEmpty);
    });

    test('ids are never reused after a delete', () async {
      final a = await repo.saveCustomFood(_food('Bar'));
      await repo.deleteCustomFood(a);
      final b = await repo.saveCustomFood(_food('Bar'));
      expect(b, greaterThan(a));
    });

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchCustomFoods().map((l) => l.length),
        before: 0,
        change: () => repo.saveCustomFood(_food('Bar')),
        after: 1,
      );
    });
  });
}
