import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [PauseRepository] held in memory.
final class InMemoryPauseRepository implements PauseRepository {
  final _pauses = ObservableValue<List<Pause>>(const []);

  @override
  Stream<List<Pause>> watchPauses() => _pauses.watch();

  @override
  Future<void> savePause(Pause pause) async {
    _pauses.value = [
      for (final existing in _pauses.value)
        if (existing.from != pause.from) existing,
      pause,
    ]..sort((a, b) => a.from.compareTo(b.from));
  }

  @override
  Future<void> deletePause(Pause pause) async {
    _pauses.value = [
      for (final existing in _pauses.value)
        if (existing.from != pause.from) existing,
    ];
  }

  /// Empties the store (used by [InMemoryDataEraser]).
  void clear() => _pauses.value = const [];
}
