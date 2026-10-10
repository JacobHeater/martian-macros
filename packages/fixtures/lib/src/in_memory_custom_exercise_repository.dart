import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [CustomExerciseRepository] held in memory. Ids count up from 1 and are
/// never reused.
final class InMemoryCustomExerciseRepository
    implements CustomExerciseRepository {
  final _exercises = ObservableValue<List<Exercise>>(const []);
  var _nextId = 1;

  @override
  Stream<List<Exercise>> watchCustomExercises() => _exercises.watch().map(
    (all) => [...all]
      ..sort((a, b) {
        final byName = a.name.toLowerCase().compareTo(b.name.toLowerCase());
        return byName != 0 ? byName : a.id.compareTo(b.id);
      }),
  );

  @override
  Future<String> saveCustomExercise(Exercise exercise) async {
    if (exercise.id.isEmpty) {
      final id = '${Exercise.customIdPrefix}${_nextId++}';
      _exercises.value = [..._exercises.value, exercise.withId(id)];
      return id;
    }
    _exercises.value = [
      for (final existing in _exercises.value)
        existing.id == exercise.id ? exercise : existing,
    ];
    return exercise.id;
  }

  @override
  Future<void> deleteCustomExercise(String id) async {
    _exercises.value = [
      for (final existing in _exercises.value)
        if (existing.id != id) existing,
    ];
  }

  /// Empties the store (used by [InMemoryDataEraser]). Ids keep counting, as
  /// in the database.
  void clear() => _exercises.value = const [];
}
