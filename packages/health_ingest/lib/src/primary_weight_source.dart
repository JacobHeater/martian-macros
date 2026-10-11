import 'health_data_type.dart';
import 'health_sample.dart';

/// The scale whose readings count first (MM-71): the source with the most
/// weigh-ins in the thirty days up to [asOf], or null with none. A tie
/// goes to the source id that sorts first, so the answer never depends on
/// the order of [samples].
String? primaryWeightSource(
  Iterable<HealthSample> samples, {
  required DateTime asOf,
}) {
  final from = asOf.subtract(const Duration(days: 30));
  final counts = <String, int>{};
  for (final sample in samples) {
    if (sample.type != HealthDataType.weight) continue;
    if (sample.start.isBefore(from) || sample.start.isAfter(asOf)) continue;
    counts[sample.sourceId] = (counts[sample.sourceId] ?? 0) + 1;
  }
  String? best;
  for (final id in counts.keys.toList()..sort()) {
    if (best == null || counts[id]! > counts[best]!) best = id;
  }
  return best;
}
