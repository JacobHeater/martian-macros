import 'package:mm_domain/mm_domain.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

/// The weigh-ins the app works from (MM-68, MM-71): what the user typed,
/// and for every other day the imported weigh-in that counts, oldest
/// first. A typed value for a day is used and the import for that day is
/// kept but not used.
///
/// An imported reading that cannot be a body weight, or is dated after
/// [today], is left out, as a typed one would be refused.
List<WeightObservation> mergeWeighIns({
  required List<WeightObservation> typed,
  required List<DayWeighIn> imported,
  required CalendarDate today,
}) {
  final byDay = <int, WeightObservation>{};
  for (final weighIn in imported) {
    final date = CalendarDate.fromDateTime(weighIn.day);
    if (date.isAfter(today) || weighIn.kg < 20 || weighIn.kg > 500) continue;
    byDay[date.epochDay] = WeightObservation(date: date, weightKg: weighIn.kg);
  }
  for (final weight in typed) {
    byDay[weight.date.epochDay] = weight;
  }
  return [for (final day in byDay.keys.toList()..sort()) byDay[day]!];
}
