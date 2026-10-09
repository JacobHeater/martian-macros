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

    test(
      'a portion is stored and read back; an entry without one has none',
      () async {
        const reference = ReferenceNutrition(
          basis: ReferenceBasis.perServing,
          nutrition: NutritionTotals(
            kcal: 160,
            proteinG: 10,
            carbsG: 15,
            fatG: 6,
          ),
          servingDescription: '1 bar',
          servingGrams: 40,
          servingMilliliters: 55,
          servingUnit: PortionUnit.serving,
          densityGPerMl: 0.73,
        );
        final calculated = await repo.addFood(
          FoodEntry(
            id: 0,
            date: d1,
            meal: Meal.snack,
            name: 'Bar',
            kcal: 240,
            proteinG: 15,
            carbsG: 22.5,
            fatG: 9,
            source: QuantitySource.labelServing,
            portion: const Portion(
              method: QuantitySource.labelServing,
              basis: NutritionBasis.calculated,
              quantity: 1.5,
              unit: PortionUnit.serving,
              reference: reference,
            ),
          ),
        );
        final typed = await repo.addFood(
          FoodEntry(
            id: 0,
            date: d1,
            meal: Meal.dinner,
            name: 'Stew',
            kcal: 400,
            proteinG: 30,
            carbsG: 40,
            fatG: 10,
            source: QuantitySource.householdMeasure,
            portion: const Portion(
              method: QuantitySource.householdMeasure,
              basis: NutritionBasis.enteredTotals,
              quantity: 2,
              unit: PortionUnit.cup,
            ),
          ),
        );
        await repo.addFood(_entry(d1, 'Old style'));
        final byId = {for (final e in await repo.watchFood(d1).first) e.id: e};

        final c = byId[calculated]!.portion!;
        expect(c.basis, NutritionBasis.calculated);
        expect(c.quantity, 1.5);
        expect(c.unit, PortionUnit.serving);
        expect(c.method, QuantitySource.labelServing);
        expect(c.reference!.basis, ReferenceBasis.perServing);
        expect(c.reference!.nutrition.kcal, 160);
        expect(c.reference!.servingDescription, '1 bar');
        expect(c.reference!.servingGrams, 40);
        expect(c.reference!.servingMilliliters, 55);
        expect(c.reference!.servingUnit, PortionUnit.serving);
        expect(c.reference!.densityGPerMl, 0.73);
        expect(byId[calculated]!.kcal, 240, reason: 'totals stay as logged');

        final t = byId[typed]!.portion!;
        expect(t.basis, NutritionBasis.enteredTotals);
        expect(t.quantity, 2);
        expect(t.unit, PortionUnit.cup);
        expect(t.reference, isNull);
        expect(byId[typed]!.kcal, 400, reason: 'typed totals are not scaled');

        expect(
          byId.values.singleWhere((e) => e.name == 'Old style').portion,
          isNull,
        );
      },
    );

    test('an update can change or clear the portion', () async {
      final id = await repo.addFood(
        FoodEntry(
          id: 0,
          date: d1,
          meal: Meal.lunch,
          name: 'Oats',
          kcal: 300,
          proteinG: 10,
          carbsG: 50,
          fatG: 5,
          source: QuantitySource.weighed,
          portion: const Portion(
            method: QuantitySource.weighed,
            basis: NutritionBasis.enteredTotals,
            quantity: 80,
            unit: PortionUnit.gram,
          ),
        ),
      );
      await repo.updateFood(
        FoodEntry(
          id: id,
          date: d1,
          meal: Meal.lunch,
          name: 'Oats',
          kcal: 300,
          proteinG: 10,
          carbsG: 50,
          fatG: 5,
          source: QuantitySource.quickAdd,
        ),
      );
      expect((await repo.watchFood(d1).first).single.portion, isNull);
    });

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
