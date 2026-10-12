import 'health_data_type.dart';

/// One reading from a health platform (MM-67), with where it came from.
final class HealthSample {
  const HealthSample({
    required this.platformId,
    required this.type,
    required this.value,
    required this.start,
    required this.sourceId,
    required this.sourceName,
    this.end,
  });

  /// The platform's own id for the reading. It stays the same when the
  /// reading is edited, which is how a re-import does not duplicate.
  final String platformId;
  final HealthDataType type;

  /// In the unit of [type].
  final double value;

  /// When it was taken, or began.
  final DateTime start;

  /// When it ended, for a reading with a span (a workout, steps).
  final DateTime? end;

  /// The app or device that wrote it, as the platform identifies it, and
  /// its name as shown to the user.
  final String sourceId;
  final String sourceName;

  @override
  bool operator ==(Object other) =>
      other is HealthSample &&
      other.platformId == platformId &&
      other.type == type &&
      other.value == value &&
      other.start == start &&
      other.end == end &&
      other.sourceId == sourceId &&
      other.sourceName == sourceName;

  @override
  int get hashCode =>
      Object.hash(platformId, type, value, start, end, sourceId, sourceName);

  @override
  String toString() =>
      'HealthSample($platformId, ${type.name}, $value, $start, $sourceId)';
}
