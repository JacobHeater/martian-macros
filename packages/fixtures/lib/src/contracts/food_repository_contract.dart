import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

FoodEntry _entry(CalendarDate date, String name, {double kcal = 100}) =>
    FoodEntry(
      id: 0,
      date: date,
      meal: Meal.lunch,
      name: name,
      kcal: kcal,
      proteinG: 10,
      carbsG: 10,
      fatG: 2,
      source: QuantitySource.weighed,
    );

/// What every [FoodRepository] must do.
void foodRepositoryContract(String name, FoodRepository Function() create) {
  group('$name as a FoodRepository', () {
    late FoodRepository repo;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 2);

    setUp(() => repo = create());

    test('a day with nothing logged is empty', () async {
      expect(await repo.watchFood(d1).first, isEmpty);
    });

    test('add returns increasing ids and keeps the fields', () async {
      final a = await repo.addFood(_entry(d1, 'Oats', kcal: 300));
      final b = await repo.addFood(_entry(d1, 'Eggs'));
      expect(b, greaterThan(a));
      final list = await repo.watchFood(d1).first;
      expect([for (final e in list) e.id], [a, b]);
      expect(list.first.name, 'Oats');
      expect(list.first.kcal, 300);
      expect(list.first.meal, Meal.lunch);
      expect(list.first.source, QuantitySource.weighed);
    });

    test('a day shows only its own entries, in the order added', () async {
      await repo.addFood(_entry(d1, 'First'));
      await repo.addFood(_entry(d2, 'Other day'));
      await repo.addFood(_entry(d1, 'Second'));
      final list = await repo.watchFood(d1).first;
      expect([for (final e in list) e.name], ['First', 'Second']);
    });

    test('delete removes an entry; a missing id does nothing', () async {
      final id = await repo.addFood(_entry(d1, 'Oats'));
      await repo.deleteFood(id + 100);
      expect(await repo.watchFood(d1).first, hasLength(1));
      await repo.deleteFood(id);
      expect(await repo.watchFood(d1).first, isEmpty);
    });

    test(
      'update changes an entry in place; a missing id does nothing',
      () async {
        final a = await repo.addFood(_entry(d1, 'Oats', kcal: 300));
        final b = await repo.addFood(_entry(d1, 'Eggs'));
        await repo.updateFood(
          FoodEntry(
            id: a,
            date: d2,
            meal: Meal.dinner,
            name: 'Porridge',
            kcal: 250,
            proteinG: 9,
            carbsG: 40,
            fatG: 5,
            source: QuantitySource.householdMeasure,
          ),
        );
        await repo.updateFood(
          FoodEntry(
            id: b + 100,
            date: d1,
            meal: Meal.lunch,
            name: 'Ghost',
            kcal: 1,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            source: QuantitySource.weighed,
          ),
        );
        final moved = (await repo.watchFood(d2).first).single;
        expect(moved.id, a);
        expect(moved.name, 'Porridge');
        expect(moved.meal, Meal.dinner);
        expect(moved.kcal, 250);
        expect(moved.proteinG, 9);
        expect(moved.source, QuantitySource.householdMeasure);
        final left = await repo.watchFood(d1).first;
        expect([for (final e in left) e.name], ['Eggs']);
      },
    );

    test('ids are never reused after a delete', () async {
      final a = await repo.addFood(_entry(d1, 'Oats'));
      await repo.deleteFood(a);
      final b = await repo.addFood(_entry(d1, 'Eggs'));
      expect(b, greaterThan(a));
    });

    test(
      'recent foods are distinct by name, newest first, and limited',
      () async {
        await repo.addFood(_entry(d1, 'Oats'));
        await repo.addFood(_entry(d1, 'Eggs'));
        await repo.addFood(_entry(d2, 'oats', kcal: 250));
        final recent = await repo.watchRecentFoods().first;
        expect(
          [for (final e in recent) e.name.toLowerCase()],
          ['oats', 'eggs'],
        );
        expect(recent.first.kcal, 250);
        expect(await repo.watchRecentFoods(limit: 1).first, hasLength(1));
      },
    );

    test('emits the current list first, then each change', () async {
      await expectChangeEmits(
        repo.watchFood(d1).map((l) => l.length),
        before: 0,
        change: () => repo.addFood(_entry(d1, 'Oats')),
        after: 1,
      );
    });
  });
}
