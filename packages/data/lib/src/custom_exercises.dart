import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// Exercises the user added (MM-76).
@DataClassName('CustomExerciseRow')
class CustomExercises extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text()();
  TextColumn get equipment => textEnum<Equipment>()();
  TextColumn get primaryMuscle => textEnum<MuscleGroup>()();

  /// The names of the secondary [MuscleGroup]s, comma-separated; empty for
  /// none.
  TextColumn get secondaryMuscles => text()();
  TextColumn get loadKind => textEnum<ExerciseLoad>()();
}
