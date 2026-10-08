import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [WeightRepository] held in memory.
final class InMemoryWeightRepository implements WeightRepository {
  final _byDay = ObservableValue<Map<int, WeightObservation>>({});

  @override
  Stream<List<WeightObservation>> watchWeights() => _byDay.watch().map(_sorted);

  @override
  Future<void> saveWeight(CalendarDate date, double weightKg) async {
    final existing = _byDay.value[date.epochDay];
    _byDay.value = {
      ..._byDay.value,
      date.epochDay: WeightObservation(
        date: date,
        weightKg: weightKg,
        // An update keeps the source of the reading it replaces.
        deviceId: existing?.deviceId,
      ),
    };
  }

  @override
  Future<void> deleteWeight(CalendarDate date) async {
    _byDay.value = {..._byDay.value}..remove(date.epochDay);
  }

  void clear() => _byDay.value = {};

  static List<WeightObservation> _sorted(Map<int, WeightObservation> byDay) => [
    for (final day in byDay.keys.toList()..sort()) byDay[day]!,
  ];
}
