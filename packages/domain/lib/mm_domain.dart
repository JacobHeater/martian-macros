/// Domain model shared by the engine, persistence, and UI layers.
///
/// All physical quantities are SI (kg, cm, kcal, g) and named with a unit
/// suffix. Imperial conversion happens only at the UI edge (see [Units]).
library;

export 'src/biological_sex.dart';
export 'src/body_fat_method.dart';
export 'src/body_fat_observation.dart';
export 'src/calendar_date.dart';
export 'src/caution.dart';
export 'src/coaching_policy.dart';
export 'src/day_completeness.dart';
export 'src/food_energy.dart';
export 'src/food_entry.dart';
export 'src/goal_mode.dart';
export 'src/intake_day.dart';
export 'src/intake_day_from.dart';
export 'src/meal.dart';
export 'src/menstruation_day.dart';
export 'src/profile.dart';
export 'src/quantity_source.dart';
export 'src/screening_answers.dart';
export 'src/training_status.dart';
export 'src/unit_system.dart';
export 'src/units.dart';
export 'src/user_setup.dart';
export 'src/waist_observation.dart';
export 'src/weight_observation.dart';
