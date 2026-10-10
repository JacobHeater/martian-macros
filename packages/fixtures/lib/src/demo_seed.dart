import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'typical_setup.dart';

/// Deterministic synthetic observations, relative to a local calendar day.
/// The caller must select an isolated demo store before allowing a reset.
final class DemoSeed {
  const DemoSeed(this.today);

  final CalendarDate today;
  static const historyDays = 70;

  Future<void> replace({
    required DataEraser eraser,
    required SetupWriter setup,
    required WeightWriter weights,
    required WaistWriter waist,
    required FoodEntryWriter food,
    required DayMarkWriter dayMarks,
    required TargetsHistoryWriter targets,
    required RecoveryCheckInWriter recovery,
  }) async {
    await eraser.eraseAll();
    final start = today.addDays(-historyDays);
    await setup.saveSetup(
      typicalSetup(onboardedOn: start, healthCheckConfirmedOn: today),
    );
    for (var i = 0; i <= historyDays; i++) {
      final date = start.addDays(i);
      await weights.saveWeight(date, 86 - i * 0.035 + math.sin(i * 1.7) * 0.35);
      if (i % 7 == 0) {
        await waist.saveWaist(date, 94 - i * 0.045);
        await recovery.saveRecoveryCheckIn(
          RecoveryCheckIn(
            date: date,
            hunger: 3 + (i ~/ 7 % 2),
            energy: 4,
            sleep: 3 + (i ~/ 7 % 2),
            training: 4,
            mood: 4,
            sleepHours: 7.0 + (i ~/ 7 % 3) * 0.25,
          ),
        );
        final kcal = 2300.0 - (i ~/ 28) * 50;
        await targets.saveTargets(
          TargetsRecord(
            effectiveFrom: date,
            targets: DailyTargets(
              kcal: kcal,
              proteinG: 160,
              proteinMinimumG: 140,
              fatG: 70,
              carbsG: (kcal - 160 * 4 - 70 * 9) / 4,
              weeklyRateFraction: -0.003,
            ),
            mode: GoalMode.fatLoss,
            tdeeKcal: 2600 - (i ~/ 28) * 30,
            tdeeSigmaKcal: 160,
            tdeeStatus: i < 28 ? TdeeStatus.held : TdeeStatus.updated,
            safetyBodyFatPercent: 24,
          ),
        );
      }
      final partial = i == historyDays;
      await dayMarks.setCompleteness(
        date,
        partial ? DayCompleteness.partial : DayCompleteness.complete,
      );
      final variation = (i % 5 - 2) * 8.0;
      for (final (meal, name, protein, carbs, fat, fiber) in [
        (Meal.breakfast, 'Demo oats and yogurt', 40.0, 65.0, 18.0, 8.0),
        if (!partial) ...[
          (Meal.lunch, 'Demo chicken and rice', 55.0, 90.0, 22.0, 6.0),
          (Meal.dinner, 'Demo tofu and potatoes', 50.0, 80.0, 25.0, 10.0),
          (Meal.snack, 'Demo fruit and nuts', 15.0, 25.0, 10.0, 5.0),
        ],
      ]) {
        final adjustedCarbs = carbs + variation / 4;
        await food.addFood(
          FoodEntry(
            id: 0,
            date: date,
            meal: meal,
            name: name,
            kcal: protein * 4 + adjustedCarbs * 4 + fat * 9,
            proteinG: protein,
            carbsG: adjustedCarbs,
            fatG: fat,
            fiberG: fiber,
            sodiumMg: 350,
            source: QuantitySource.weighed,
          ),
        );
      }
    }
  }
}
