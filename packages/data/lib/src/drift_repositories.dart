import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'app_database.dart';
import 'drift_custom_food_repository.dart';
import 'drift_data_eraser.dart';
import 'drift_day_mark_repository.dart';
import 'drift_food_repository.dart';
import 'drift_insight_log_repository.dart';
import 'drift_intake_reader.dart';
import 'drift_preferences_repository.dart';
import 'drift_setup_repository.dart';
import 'drift_targets_history_repository.dart';
import 'drift_waist_repository.dart';
import 'drift_weight_event_repository.dart';
import 'drift_weight_repository.dart';

/// Every repository over one [AppDatabase]. The one place that knows which
/// Drift class implements which interface.
final class DriftRepositories {
  DriftRepositories(AppDatabase db)
    : _db = db,
      setup = DriftSetupRepository(db),
      weights = DriftWeightRepository(db),
      weightEvents = DriftWeightEventRepository(db),
      waist = DriftWaistRepository(db),
      food = DriftFoodRepository(db),
      customFoods = DriftCustomFoodRepository(db),
      dayMarks = DriftDayMarkRepository(db),
      intake = DriftIntakeReader(db),
      targets = DriftTargetsHistoryRepository(db),
      preferences = DriftPreferencesRepository(db),
      insightLog = DriftInsightLogRepository(db),
      eraser = DriftDataEraser(db);

  final AppDatabase _db;
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

  /// Closes the underlying database.
  Future<void> close() => _db.close();
}
