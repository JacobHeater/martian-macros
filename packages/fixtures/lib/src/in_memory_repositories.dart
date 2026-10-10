import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'in_memory_custom_food_repository.dart';
import 'in_memory_data_eraser.dart';
import 'in_memory_day_mark_repository.dart';
import 'in_memory_food_repository.dart';
import 'in_memory_insight_log_repository.dart';
import 'in_memory_intake_reader.dart';
import 'in_memory_preferences_repository.dart';
import 'in_memory_setup_repository.dart';
import 'in_memory_targets_history_repository.dart';
import 'in_memory_waist_repository.dart';
import 'in_memory_weight_event_repository.dart';
import 'in_memory_weight_repository.dart';

/// Every repository, in memory, sharing state where the real ones do (the
/// intake reader sees the food log and day marks; the eraser empties all).
/// The in-memory counterpart of `DriftRepositories`.
final class InMemoryRepositories {
  factory InMemoryRepositories() {
    final setup = InMemorySetupRepository();
    final weights = InMemoryWeightRepository();
    final weightEvents = InMemoryWeightEventRepository();
    final waist = InMemoryWaistRepository();
    final food = InMemoryFoodRepository();
    final customFoods = InMemoryCustomFoodRepository();
    final dayMarks = InMemoryDayMarkRepository();
    final targets = InMemoryTargetsHistoryRepository();
    final preferences = InMemoryPreferencesRepository();
    final insightLog = InMemoryInsightLogRepository();
    return InMemoryRepositories._(
      setup: setup,
      weights: weights,
      weightEvents: weightEvents,
      waist: waist,
      food: food,
      customFoods: customFoods,
      dayMarks: dayMarks,
      intake: InMemoryIntakeReader(food, dayMarks),
      targets: targets,
      preferences: preferences,
      insightLog: insightLog,
      eraser: InMemoryDataEraser([
        setup.clear,
        weights.clear,
        weightEvents.clear,
        waist.clear,
        food.clear,
        customFoods.clear,
        dayMarks.clear,
        targets.clear,
        preferences.clear,
        insightLog.clear,
      ]),
    );
  }

  InMemoryRepositories._({
    required this.setup,
    required this.weights,
    required this.weightEvents,
    required this.waist,
    required this.food,
    required this.customFoods,
    required this.dayMarks,
    required this.intake,
    required this.targets,
    required this.preferences,
    required this.insightLog,
    required this.eraser,
  });

  final SetupRepository setup;
  final WeightRepository weights;
  final WeightEventRepository weightEvents;
  final WaistRepository waist;
  final FoodRepository food;
  final CustomFoodRepository customFoods;
  final DayMarkRepository dayMarks;
  final IntakeReader intake;
  final TargetsHistoryRepository targets;
  final PreferencesRepository preferences;
  final InsightLogRepository insightLog;
  final DataEraser eraser;

  /// Nothing to release; present so it can stand in for `DriftRepositories`.
  Future<void> close() async {}
}
