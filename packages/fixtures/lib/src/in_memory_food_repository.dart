import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [FoodRepository] held in memory. Ids count up from 1 and are never reused.
final class InMemoryFoodRepository implements FoodRepository {
  final _entries = ObservableValue<List<FoodEntry>>([]);
  var _nextId = 1;

  /// Every entry, for implementations that derive from the log
  /// (see [InMemoryIntakeReader]).
  Stream<List<FoodEntry>> watchAll() => _entries.watch();

  @override
  Stream<List<FoodEntry>> watchFood(CalendarDate date) => _entries.watch().map(
    (all) => [
      for (final e in all)
        if (e.date.epochDay == date.epochDay) e,
    ],
  );

  @override
  Future<int> addFood(FoodEntry entry) async {
    final id = _nextId++;
    _entries.value = [
      ..._entries.value,
      FoodEntry(
        id: id,
        date: entry.date,
        meal: entry.meal,
        name: entry.name,
        kcal: entry.kcal,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        source: entry.source,
      ),
    ];
    return id;
  }

  @override
  Future<void> updateFood(FoodEntry entry) async {
    _entries.value = [
      for (final e in _entries.value) e.id == entry.id ? entry : e,
    ];
  }

  @override
  Future<void> deleteFood(int id) async {
    _entries.value = [
      for (final e in _entries.value)
        if (e.id != id) e,
    ];
  }

  @override
  Stream<List<FoodEntry>> watchRecentFoods({int limit = 20}) =>
      _entries.watch().map((all) {
        final newestFirst = all.reversed.take(200);
        final seen = <String>{};
        return [
          for (final e in newestFirst)
            if (seen.add(e.name.toLowerCase())) e,
        ].take(limit).toList();
      });

  /// Empties the log. Ids keep counting, as in the database.
  void clear() => _entries.value = [];
}
