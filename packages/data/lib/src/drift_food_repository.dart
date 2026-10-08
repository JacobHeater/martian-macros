import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';
import 'food_from_row.dart';

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
        FoodEntriesCompanion.insert(
          epochDay: entry.date.epochDay,
          meal: entry.meal,
          name: entry.name,
          kcal: entry.kcal,
          proteinG: entry.proteinG,
          carbsG: entry.carbsG,
          fatG: entry.fatG,
          quantitySource: entry.source,
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
