import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [WaistRepository] held in memory.
final class InMemoryWaistRepository implements WaistRepository {
  final _byDay = ObservableValue<Map<int, WaistObservation>>({});

  @override
  Stream<List<WaistObservation>> watchWaist() => _byDay.watch().map(
    (byDay) => [for (final day in byDay.keys.toList()..sort()) byDay[day]!],
  );

  @override
  Future<void> saveWaist(CalendarDate date, double waistCm) async {
    _byDay.value = {
      ..._byDay.value,
      date.epochDay: WaistObservation(date: date, waistCm: waistCm),
    };
  }

  void clear() => _byDay.value = {};
}
