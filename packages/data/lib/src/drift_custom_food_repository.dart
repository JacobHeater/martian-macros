import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [CustomFoodRepository] over the Drift database.
final class DriftCustomFoodRepository implements CustomFoodRepository {
  DriftCustomFoodRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<CustomFood>> watchCustomFoods() =>
      (_db.select(_db.customFoods)..orderBy([
            (t) => OrderingTerm.asc(t.name),
            (t) => OrderingTerm.asc(t.id),
          ]))
          .watch()
          .asyncMap(_withIngredients);

  Future<List<CustomFood>> _withIngredients(List<CustomFoodRow> rows) async {
    final lines = await (_db.select(
      _db.recipeIngredients,
    )..orderBy([(t) => OrderingTerm.asc(t.position)])).get();
    final byRecipe = <int, List<RecipeIngredient>>{};
    for (final l in lines) {
      byRecipe
          .putIfAbsent(l.recipeId, () => [])
          .add(
            RecipeIngredient(
              name: l.name,
              grams: l.grams,
              totals: NutritionTotals(
                kcal: l.kcal,
                proteinG: l.proteinG,
                carbsG: l.carbsG,
                fatG: l.fatG,
              ),
            ),
          );
    }
    return [
      for (final r in rows)
        CustomFood(
          id: r.id,
          name: r.name,
          kind: r.kind,
          servingDescription: r.servingDescription,
          servingGrams: r.servingGrams,
          perServing: NutritionTotals(
            kcal: r.kcal,
            proteinG: r.proteinG,
            carbsG: r.carbsG,
            fatG: r.fatG,
          ),
          barcode: r.barcode,
          servings: r.servings,
          cookedWeightGrams: r.cookedWeightGrams,
          ingredients: byRecipe[r.id] ?? const [],
        ),
    ];
  }

  @override
  Future<int> saveCustomFood(CustomFood food) => _db.transaction(() async {
    final row = CustomFoodsCompanion(
      name: Value(food.name),
      kind: Value(food.kind),
      servingDescription: Value(food.servingDescription),
      servingGrams: Value(food.servingGrams),
      kcal: Value(food.perServing.kcal),
      proteinG: Value(food.perServing.proteinG),
      carbsG: Value(food.perServing.carbsG),
      fatG: Value(food.perServing.fatG),
      barcode: Value(food.barcode),
      servings: Value(food.servings),
      cookedWeightGrams: Value(food.cookedWeightGrams),
    );
    final int id;
    if (food.id == 0) {
      id = await _db.into(_db.customFoods).insert(row);
    } else {
      id = food.id;
      await (_db.update(
        _db.customFoods,
      )..where((t) => t.id.equals(id))).write(row);
      await (_db.delete(
        _db.recipeIngredients,
      )..where((t) => t.recipeId.equals(id))).go();
    }
    var position = 0;
    for (final i in food.ingredients) {
      await _db
          .into(_db.recipeIngredients)
          .insert(
            RecipeIngredientsCompanion.insert(
              recipeId: id,
              position: position++,
              name: i.name,
              grams: Value(i.grams),
              kcal: i.totals.kcal,
              proteinG: i.totals.proteinG,
              carbsG: i.totals.carbsG,
              fatG: i.totals.fatG,
            ),
          );
    }
    return id;
  });

  @override
  Future<void> deleteCustomFood(int id) => _db.transaction(() async {
    await (_db.delete(
      _db.recipeIngredients,
    )..where((t) => t.recipeId.equals(id))).go();
    await (_db.delete(_db.customFoods)..where((t) => t.id.equals(id))).go();
  });
}
