import 'day_weigh_in.dart';
import 'health_data_type.dart';
import 'health_sample.dart';
import 'weigh_in_basis.dart';

/// The imported weigh-in that counts for each day (MM-71), oldest day
/// first, from the weight readings among [samples].
///
/// A day's readings from [primarySourceId] count before any other
/// source's; with none from it that day, the others' do. Among those, the
/// first reading between 04:00 and 12:00 local time counts; with no
/// morning reading, the middle value of them does. The same readings in
/// any order give the same answer.
///
/// A value the user typed for a day overrules all of this; that is the
/// caller's to apply, since this knows only what was imported.
List<DayWeighIn> dailyWeighIns(
  Iterable<HealthSample> samples, {
  String? primarySourceId,
}) {
  final byDay = <DateTime, List<HealthSample>>{};
  for (final sample in samples) {
    if (sample.type != HealthDataType.weight) continue;
    final at = sample.start;
    byDay
        .putIfAbsent(DateTime(at.year, at.month, at.day), () => [])
        .add(sample);
  }
  final result = <DayWeighIn>[];
  for (final day in byDay.keys.toList()..sort()) {
    final all = byDay[day]!;
    final fromPrimary = [
      for (final sample in all)
        if (sample.sourceId == primarySourceId) sample,
    ];
    final group = (fromPrimary.isEmpty ? all : fromPrimary)
      ..sort((a, b) {
        final byStart = a.start.compareTo(b.start);
        return byStart != 0 ? byStart : a.platformId.compareTo(b.platformId);
      });
    final names = {for (final sample in group) sample.sourceName};
    final morning = [
      for (final sample in group)
        if (sample.start.hour >= 4 && sample.start.hour < 12) sample,
    ];
    if (morning.isNotEmpty) {
      final first = morning.first;
      result.add(
        DayWeighIn(
          day: day,
          kg: first.value,
          basis: WeighInBasis.firstMorning,
          sourceName: first.sourceName,
          readings: group.length,
          at: first.start,
        ),
      );
      continue;
    }
    final values = [for (final sample in group) sample.value]..sort();
    final mid = values.length ~/ 2;
    result.add(
      DayWeighIn(
        day: day,
        kg: values.length.isOdd
            ? values[mid]
            : (values[mid - 1] + values[mid]) / 2,
        basis: WeighInBasis.medianOfDay,
        sourceName: names.length == 1 ? names.single : 'several sources',
        readings: group.length,
      ),
    );
  }
  return result;
}
