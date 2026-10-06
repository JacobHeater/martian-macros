/// Domain model shared by the engine, persistence, and UI layers.
///
/// All physical quantities are SI (kg, cm, kcal, g) and named with a unit
/// suffix. Imperial conversion happens only at the UI edge (see [Units]).
library;

export 'src/biological_sex.dart';
export 'src/calendar_date.dart';
export 'src/food_entry.dart';
export 'src/goal.dart';
export 'src/observations.dart';
export 'src/profile.dart';
export 'src/quantity_source.dart';
export 'src/screening.dart';
export 'src/units.dart';
export 'src/user_setup.dart';
