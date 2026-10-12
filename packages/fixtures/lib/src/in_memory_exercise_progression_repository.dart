import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [ExerciseProgressionRepository] held in memory.
final class InMemoryExerciseProgressionRepository
    implements ExerciseProgressionRepository {
  final _byExercise = ObservableValue<Map<String, ExerciseProgression>>({});

  @override
  Stream<List<ExerciseProgression>> watchExerciseProgressions() => _byExercise
      .watch()
      .map((all) => [for (final id in all.keys.toList()..sort()) all[id]!]);

  @override
  Future<void> saveExerciseProgression(ExerciseProgression progression) async {
    _byExercise.value = {
      ..._byExercise.value,
      progression.exerciseId: progression,
    };
  }

  @override
  Future<void> clearExerciseProgression(String exerciseId) async {
    _byExercise.value = {
      for (final entry in _byExercise.value.entries)
        if (entry.key != exerciseId) entry.key: entry.value,
    };
  }

  void clear() => _byExercise.value = {};
}
