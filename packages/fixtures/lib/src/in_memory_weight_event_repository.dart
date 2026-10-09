import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [WeightEventRepository] held in memory.
final class InMemoryWeightEventRepository implements WeightEventRepository {
  final _events = ObservableValue<List<WeightEvent>>([]);

  @override
  Stream<List<WeightEvent>> watchWeightEvents() => _events.watch();

  @override
  Future<void> saveWeightEvent(WeightEvent event) async {
    final events =
        [
          for (final existing in _events.value)
            if (existing.date != event.date || existing.type != event.type)
              existing,
          event,
        ]..sort((a, b) {
          final byDate = a.date.compareTo(b.date);
          return byDate != 0 ? byDate : a.type.index.compareTo(b.type.index);
        });
    _events.value = events;
  }

  @override
  Future<void> deleteWeightEvent(WeightEvent event) async {
    _events.value = [
      for (final existing in _events.value)
        if (existing.date != event.date || existing.type != event.type)
          existing,
    ];
  }

  /// Empties the store (used by [InMemoryDataEraser]).
  void clear() => _events.value = [];
}
