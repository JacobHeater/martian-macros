import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

void main() {
  test('synthetic histories reset deterministically in fixtures', () async {
    final repositories = InMemoryRepositories();
    await exerciseDemoSeed(
      eraser: repositories.eraser,
      setup: repositories.setup,
      weights: repositories.weights,
      waist: repositories.waist,
      food: repositories.food,
      marks: repositories.dayMarks,
      intake: repositories.intake,
      targets: repositories.targets,
      recovery: repositories.recovery,
    );
  });

  test(
    'synthetic histories reset in SQLite without touching another store',
    () async {
      final demo = DriftRepositories(AppDatabase(NativeDatabase.memory()));
      final normal = DriftRepositories(AppDatabase(NativeDatabase.memory()));
      addTearDown(demo.close);
      addTearDown(normal.close);
      final day = CalendarDate(2026, 10, 10);
      await normal.weights.saveWeight(day, 99);
      await exerciseDemoSeed(
        eraser: demo.eraser,
        setup: demo.setup,
        weights: demo.weights,
        waist: demo.waist,
        food: demo.food,
        marks: demo.dayMarks,
        intake: demo.intake,
        targets: demo.targets,
        recovery: demo.recovery,
      );
      expect((await normal.weights.watchWeights().first).single.weightKg, 99);
      expect(await normal.setup.loadSetup(), isNull);
    },
  );
}

Future<void> exerciseDemoSeed({
  required DataEraser eraser,
  required SetupRepository setup,
  required WeightRepository weights,
  required WaistRepository waist,
  required FoodRepository food,
  required DayMarkRepository marks,
  required IntakeReader intake,
  required TargetsHistoryRepository targets,
  required RecoveryCheckInRepository recovery,
}) async {
  final today = CalendarDate(2026, 10, 10);
  Future<void> seed(CalendarDate day) => DemoSeed(day).replace(
    eraser: eraser,
    setup: setup,
    weights: weights,
    waist: waist,
    food: food,
    dayMarks: marks,
    targets: targets,
    recovery: recovery,
  );
  await seed(today);
  final initialWeights = await weights.watchWeights().first;
  final initialDays = await intake
      .watchIntakeDays(since: today.addDays(-100))
      .first;
  expect(initialWeights, hasLength(71));
  expect(initialWeights.first.date, today.addDays(-70));
  expect(initialWeights.last.date, today);
  expect(initialWeights.last.weightKg, lessThan(initialWeights.first.weightKg));
  expect(initialDays, hasLength(71));
  expect(
    initialDays
        .take(70)
        .every((d) => d.completeness == DayCompleteness.complete),
    isTrue,
  );
  expect(initialDays.last.completeness, DayCompleteness.partial);
  expect(initialDays.last.kcal, lessThan(1000));
  expect(await food.watchFood(today).first, hasLength(1));
  expect(await food.watchFood(today.addDays(-1)).first, hasLength(4));
  expect(await waist.watchWaist().first, hasLength(11));
  expect(await recovery.watchRecoveryCheckIns().first, hasLength(11));
  final history = await targets.watchTargetsHistory().first;
  expect(history, hasLength(11));
  expect(history.last.effectiveFrom, today);
  expect(history.map((t) => t.targets.kcal).toSet().length, greaterThan(1));
  expect((await setup.loadSetup())!.onboardedOn, today.addDays(-70));
  await food.addFood(
    FoodEntry(
      id: 0,
      date: today,
      meal: Meal.snack,
      name: 'Discard this demo edit',
      kcal: 100,
      proteinG: 5,
      carbsG: 20,
      fatG: 0,
      source: QuantitySource.quickAdd,
    ),
  );
  await seed(today);
  expect(await food.watchFood(today).first, hasLength(1));
  expect(
    (await weights.watchWeights().first).map((w) => w.weightKg).toList(),
    initialWeights.map((w) => w.weightKg).toList(),
  );
  expect(
    (await intake.watchIntakeDays(since: today.addDays(-100)).first)
        .map((d) => d.kcal)
        .toList(),
    initialDays.map((d) => d.kcal).toList(),
  );
  await seed(today.addDays(1));
  final shifted = await weights.watchWeights().first;
  expect(shifted, hasLength(71));
  expect(shifted.first.date, today.addDays(-69));
  expect(shifted.last.date, today.addDays(1));
}
