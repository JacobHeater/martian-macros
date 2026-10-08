import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import '../typical_setup.dart';

/// What every [DataEraser] must do. [create] returns the eraser and the
/// repositories it must empty.
void dataEraserContract(
  String name,
  ({
    DataEraser eraser,
    SetupRepository setup,
    WeightRepository weights,
    FoodRepository food,
    TargetsHistoryRepository targets,
    PreferencesRepository preferences,
  })
  Function()
  create,
) {
  group('$name as a DataEraser', () {
    test('eraseAll empties everything', () async {
      final r = create();
      final day = CalendarDate(2026, 1, 1);
      await r.setup.saveSetup(typicalSetup());
      await r.weights.saveWeight(day, 80);
      await r.food.addFood(
        FoodEntry(
          id: 0,
          date: day,
          meal: Meal.breakfast,
          name: 'Oats',
          kcal: 300,
          proteinG: 10,
          carbsG: 50,
          fatG: 5,
          source: QuantitySource.weighed,
        ),
      );
      await r.preferences.saveThemePreference(ThemePreference.dark);
      await r.targets.saveTargets(
        TargetsRecord(
          effectiveFrom: day,
          mode: GoalMode.fatLoss,
          tdeeKcal: 2600,
          tdeeSigmaKcal: 300,
          tdeeStatus: TdeeStatus.held,
          targets: const DailyTargets(
            kcal: 2000,
            proteinG: 160,
            fatG: 70,
            carbsG: 200,
            weeklyRateFraction: -0.0075,
          ),
        ),
      );

      await r.eraser.eraseAll();

      expect(await r.setup.loadSetup(), isNull);
      expect(await r.weights.watchWeights().first, isEmpty);
      expect(await r.food.watchFood(day).first, isEmpty);
      expect(await r.targets.watchTargetsHistory().first, isEmpty);
      expect(
        await r.preferences.watchThemePreference().first,
        ThemePreference.system,
      );
    });
  });
}
