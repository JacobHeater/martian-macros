import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';
import 'food_from_row.dart';
import 'portion_columns.dart';

/// [FoodRepository] over the Drift database.
final class DriftFoodRepository implements FoodRepository {
  DriftFoodRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<FoodEntry>> watchFood(CalendarDate date) =>
      (_db.select(_db.foodEntries)
            ..where((t) => t.epochDay.equals(date.epochDay))
            ..orderBy([(t) => OrderingTerm.asc(t.id)]))
          .watch()
          .map((rows) => [for (final r in rows) foodFromRow(r)]);

  @override
  Future<int> addFood(FoodEntry entry) => _db
      .into(_db.foodEntries)
      .insert(
        withPortion(
          FoodEntriesCompanion.insert(
            epochDay: entry.date.epochDay,
            meal: entry.meal,
            name: entry.name,
            kcal: entry.kcal,
            proteinG: entry.proteinG,
            carbsG: entry.carbsG,
            fatG: entry.fatG,
            quantitySource: entry.source,
            fiberG: Value(entry.fiberG),
            sodiumMg: Value(entry.sodiumMg),
            alcoholG: Value(entry.alcoholG),
          ),
          entry.portion,
        ),
      );

  @override
  Future<void> updateFood(FoodEntry entry) =>
      (_db.update(_db.foodEntries)..where((t) => t.id.equals(entry.id))).write(
        withPortion(
          FoodEntriesCompanion(
            epochDay: Value(entry.date.epochDay),
            meal: Value(entry.meal),
            name: Value(entry.name),
            kcal: Value(entry.kcal),
            proteinG: Value(entry.proteinG),
            carbsG: Value(entry.carbsG),
            fatG: Value(entry.fatG),
            quantitySource: Value(entry.source),
            fiberG: Value(entry.fiberG),
            sodiumMg: Value(entry.sodiumMg),
            alcoholG: Value(entry.alcoholG),
          ),
          entry.portion,
        ),
      );

  @override
  Future<void> deleteFood(int id) =>
      (_db.delete(_db.foodEntries)..where((t) => t.id.equals(id))).go();

  @override
  Stream<List<FoodEntry>> watchRecentFoods({int limit = 20}) =>
      (_db.select(_db.foodEntries)
            ..orderBy([(t) => OrderingTerm.desc(t.id)])
            ..limit(200))
          .watch()
          .map((rows) {
            final seen = <String>{};
            return [
              for (final r in rows)
                if (seen.add(r.name.toLowerCase())) foodFromRow(r),
            ].take(limit).toList();
          });
}
