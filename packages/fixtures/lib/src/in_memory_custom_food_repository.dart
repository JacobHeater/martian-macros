import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [CustomFoodRepository] held in memory. Ids count up from 1 and are never
/// reused.
final class InMemoryCustomFoodRepository implements CustomFoodRepository {
  final _foods = ObservableValue<List<CustomFood>>([]);
  var _nextId = 1;

  @override
  Stream<List<CustomFood>> watchCustomFoods() => _foods.watch().map(
    (all) => [...all]
      ..sort((a, b) {
        final byName = a.name.compareTo(b.name);
        return byName != 0 ? byName : a.id.compareTo(b.id);
      }),
  );

  @override
  Future<int> saveCustomFood(CustomFood food) async {
    if (food.id == 0) {
      final id = _nextId++;
      _foods.value = [..._foods.value, _withId(food, id)];
      return id;
    }
    _foods.value = [
      for (final f in _foods.value)
        f.id == food.id ? _withId(food, food.id) : f,
    ];
    return food.id;
  }

  @override
  Future<void> deleteCustomFood(int id) async {
    _foods.value = [
      for (final f in _foods.value)
        if (f.id != id) f,
    ];
  }

  static CustomFood _withId(CustomFood f, int id) => CustomFood(
    id: id,
    name: f.name,
    kind: f.kind,
    servingDescription: f.servingDescription,
    perServing: f.perServing,
    servingGrams: f.servingGrams,
    barcode: f.barcode,
    servings: f.servings,
    cookedWeightGrams: f.cookedWeightGrams,
    ingredients: f.ingredients,
  );

  /// Empties the list. Ids keep counting, as in the database.
  void clear() => _foods.value = [];
}
