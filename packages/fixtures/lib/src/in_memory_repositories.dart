import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'in_memory_data_eraser.dart';
import 'in_memory_day_mark_repository.dart';
import 'in_memory_food_repository.dart';
import 'in_memory_intake_reader.dart';
import 'in_memory_preferences_repository.dart';
import 'in_memory_setup_repository.dart';
import 'in_memory_targets_history_repository.dart';
import 'in_memory_waist_repository.dart';
import 'in_memory_weight_repository.dart';

/// Every repository, in memory, sharing state where the real ones do (the
/// intake reader sees the food log and day marks; the eraser empties all).
/// The in-memory counterpart of `DriftRepositories`.
final class InMemoryRepositories {
  factory InMemoryRepositories() {
    final setup = InMemorySetupRepository();
    final weights = InMemoryWeightRepository();
    final waist = InMemoryWaistRepository();
    final food = InMemoryFoodRepository();
    final dayMarks = InMemoryDayMarkRepository();
    final targets = InMemoryTargetsHistoryRepository();
    final preferences = InMemoryPreferencesRepository();
    return InMemoryRepositories._(
      setup: setup,
      weights: weights,
      waist: waist,
      food: food,
      dayMarks: dayMarks,
      intake: InMemoryIntakeReader(food, dayMarks),
      targets: targets,
      preferences: preferences,
      eraser: InMemoryDataEraser([
        setup.clear,
        weights.clear,
        waist.clear,
        food.clear,
        dayMarks.clear,
        targets.clear,
        preferences.clear,
      ]),
    );
  }

  InMemoryRepositories._({
    required this.setup,
    required this.weights,
    required this.waist,
    required this.food,
    required this.dayMarks,
    required this.intake,
    required this.targets,
    required this.preferences,
    required this.eraser,
  });

  final SetupRepository setup;
  final WeightRepository weights;
  final WaistRepository waist;
  final FoodRepository food;
  final DayMarkRepository dayMarks;
  final IntakeReader intake;
  final TargetsHistoryRepository targets;
  final PreferencesRepository preferences;
  final DataEraser eraser;

  /// Nothing to release; present so it can stand in for `DriftRepositories`.
  Future<void> close() async {}
}
