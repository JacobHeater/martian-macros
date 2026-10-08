import 'package:mm_engine/mm_engine.dart';

import 'observable_value.dart';

/// [TargetsHistoryRepository] held in memory.
final class InMemoryTargetsHistoryRepository
    implements TargetsHistoryRepository {
  final _byDay = ObservableValue<Map<int, TargetsRecord>>({});

  @override
  Stream<List<TargetsRecord>> watchTargetsHistory() => _byDay.watch().map(
    (byDay) => [for (final day in byDay.keys.toList()..sort()) byDay[day]!],
  );

  @override
  Future<void> saveTargets(TargetsRecord record) async {
    _byDay.value = {..._byDay.value, record.effectiveFrom.epochDay: record};
  }

  void clear() => _byDay.value = {};
}
