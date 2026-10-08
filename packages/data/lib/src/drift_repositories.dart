import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'app_database.dart';
import 'drift_data_eraser.dart';
import 'drift_day_mark_repository.dart';
import 'drift_food_repository.dart';
import 'drift_intake_reader.dart';
import 'drift_setup_repository.dart';
import 'drift_targets_history_repository.dart';
import 'drift_waist_repository.dart';
import 'drift_weight_repository.dart';

/// Every repository over one [AppDatabase]. The one place that knows which
/// Drift class implements which interface.
final class DriftRepositories {
  DriftRepositories(AppDatabase db)
    : _db = db,
      setup = DriftSetupRepository(db),
      weights = DriftWeightRepository(db),
      waist = DriftWaistRepository(db),
      food = DriftFoodRepository(db),
      dayMarks = DriftDayMarkRepository(db),
      intake = DriftIntakeReader(db),
      targets = DriftTargetsHistoryRepository(db),
      eraser = DriftDataEraser(db);

  final AppDatabase _db;
  final SetupRepository setup;
  final WeightRepository weights;
  final WaistRepository waist;
  final FoodRepository food;
  final DayMarkRepository dayMarks;
  final IntakeReader intake;
  final TargetsHistoryRepository targets;
  final DataEraser eraser;

  /// Closes the underlying database.
  Future<void> close() => _db.close();
}
