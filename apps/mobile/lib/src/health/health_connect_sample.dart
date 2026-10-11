import 'package:health/health.dart' as plugin;
import 'package:mm_health_ingest/mm_health_ingest.dart';

/// What the app calls each kind of reading, and what the Health Connect
/// plugin calls it (MM-68).
const healthConnectTypes = <HealthDataType, plugin.HealthDataType>{
  HealthDataType.weight: plugin.HealthDataType.WEIGHT,
  HealthDataType.bodyFat: plugin.HealthDataType.BODY_FAT_PERCENTAGE,
  HealthDataType.leanMass: plugin.HealthDataType.LEAN_BODY_MASS,
  HealthDataType.height: plugin.HealthDataType.HEIGHT,
  HealthDataType.workout: plugin.HealthDataType.WORKOUT,
  HealthDataType.menstruation: plugin.HealthDataType.MENSTRUATION_FLOW,
  HealthDataType.steps: plugin.HealthDataType.STEPS,
};

/// A reading from the plugin as the app keeps it (MM-68), in the app's one
/// unit per type, or null for a kind of reading the app does not import.
///
/// Height arrives in meters and is kept in centimeters. A workout is kept
/// as its length in minutes, and a day of menstrual flow as 1; what the
/// platform says about either beyond that is not imported.
HealthSample? healthConnectSample(plugin.HealthDataPoint point) {
  HealthDataType? type;
  for (final entry in healthConnectTypes.entries) {
    if (entry.value == point.type) type = entry.key;
  }
  if (type == null) return null;
  final raw = point.value;
  final number = raw is plugin.NumericHealthValue
      ? raw.numericValue.toDouble()
      : null;
  final double value;
  switch (type) {
    case HealthDataType.workout:
      value = point.dateTo.difference(point.dateFrom).inSeconds / 60;
    case HealthDataType.menstruation:
      value = 1;
    case HealthDataType.height:
      if (number == null) return null;
      value = number * 100;
    case HealthDataType.weight ||
        HealthDataType.bodyFat ||
        HealthDataType.leanMass ||
        HealthDataType.steps:
      if (number == null) return null;
      value = number;
  }
  final spans = point.dateTo.isAfter(point.dateFrom);
  return HealthSample(
    platformId: point.uuid,
    type: type,
    value: value,
    start: point.dateFrom.toLocal(),
    end: spans ? point.dateTo.toLocal() : null,
    sourceId: point.sourceId,
    sourceName: point.sourceName.isEmpty ? point.sourceId : point.sourceName,
  );
}
