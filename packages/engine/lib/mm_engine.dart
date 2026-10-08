/// The metabolic engine: pure, deterministic functions of stored
/// observations. No I/O, no clocks, no randomness, so every output can be
/// recomputed from history (e.g. after a profile correction).
library;

export 'src/analyze.dart';
export 'src/body_fat_estimate.dart';
export 'src/coach_constants.dart';
export 'src/coach_snapshot.dart';
export 'src/compute_targets.dart';
export 'src/consecutive_deficit_weeks.dart';
export 'src/cycle_noise.dart';
export 'src/daily_targets.dart';
export 'src/deurenberg_body_fat.dart';
export 'src/goal_body_fat_check.dart';
export 'src/initial_tdee_prior.dart';
export 'src/mode_reason.dart';
export 'src/mode_recommendation.dart';
export 'src/next_targets.dart';
export 'src/partition.dart';
export 'src/protein_range.dart';
export 'src/recommend_mode.dart';
export 'src/resting_energy_equations.dart';
export 'src/safety_bounds.dart';
export 'src/settling_shift.dart';
export 'src/settling_window.dart';
export 'src/settling_windows.dart';
export 'src/target_flag.dart';
export 'src/target_inputs.dart';
export 'src/targets_history_reader.dart';
export 'src/targets_history_repository.dart';
export 'src/targets_history_writer.dart';
export 'src/targets_record.dart';
export 'src/tdee_estimate.dart';
export 'src/tdee_estimator.dart';
export 'src/tdee_prior.dart';
export 'src/tdee_status.dart';
export 'src/trend_shift.dart';
export 'src/weight_trend_model.dart';
export 'src/weight_trend_point.dart';
