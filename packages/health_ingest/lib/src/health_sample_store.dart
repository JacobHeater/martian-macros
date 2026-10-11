import 'health_data_type.dart';
import 'health_sample.dart';

/// Where imported readings are kept (MM-67): apart from what the user
/// typed, so importing never overwrites a typed correction, and by
/// platform id, so importing twice never duplicates.
abstract interface class HealthSampleStore {
  /// The stored readings of [type], oldest first.
  Future<List<HealthSample>> samples(HealthDataType type);

  /// Adds each reading, or replaces the stored one with its platform id.
  Future<void> upsert(List<HealthSample> samples);

  /// Removes the readings of [type] with these platform ids. Ids that are
  /// not stored are ignored.
  Future<void> delete(HealthDataType type, List<String> platformIds);

  /// Makes the stored readings of [type] exactly [samples].
  Future<void> replace(HealthDataType type, List<HealthSample> samples);

  /// The token saved for [type], or null before the first import.
  Future<String?> token(HealthDataType type);

  Future<void> saveToken(HealthDataType type, String token);
}
