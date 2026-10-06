/// The metabolic engine: pure, deterministic functions of stored
/// observations. No I/O, no clocks, no randomness, so every output can be
/// recomputed from history (e.g. after a profile correction).
library;

export 'src/body_composition.dart';
export 'src/coach.dart';
export 'src/cycle_noise.dart';
export 'src/energy_expenditure.dart';
export 'src/mode_advisor.dart';
export 'src/partition.dart';
export 'src/safety_bounds.dart';
export 'src/targets.dart';
export 'src/tdee_estimator.dart';
export 'src/weight_trend.dart';
