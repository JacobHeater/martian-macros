import 'package:drift/drift.dart';

/// The rep range and load step the user set for an exercise (MM-79). An
/// exercise with no row uses the defaults.
@DataClassName('ExerciseProgressionRow')
class ExerciseProgressions extends Table {
  /// The id of a built-in exercise or one of the user's own.
  TextColumn get exerciseId => text()();
  IntColumn get repsLow => integer()();
  IntColumn get repsHigh => integer()();

  /// Null for the default step of the exercise's equipment.
  RealColumn get loadStepKg => real().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {exerciseId};

  @override
  List<String> get customConstraints => [
    'CHECK (reps_low >= 1 AND reps_low < reps_high)',
    'CHECK (load_step_kg IS NULL OR load_step_kg > 0)',
  ];
}
