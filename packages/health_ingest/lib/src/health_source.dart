import 'health_changes.dart';
import 'health_data_type.dart';
import 'health_sample.dart';
import 'nutrition_record.dart';

/// A phone's health platform, as the app sees it (MM-67). Health Connect,
/// HealthKit and the fake all sit behind this, and one test suite
/// (`healthSourceContract`) holds each to the same behavior.
abstract interface class HealthSource {
  /// The types this platform has on this device at all.
  Future<Set<HealthDataType>> available();

  /// The types the user has let the app read. Always within [available].
  Future<Set<HealthDataType>> permitted();

  /// Asks the user for [types]. Returns what is permitted afterwards.
  Future<Set<HealthDataType>> requestPermission(Set<HealthDataType> types);

  /// The readings of [type] that start from [from] up to, not including,
  /// [to], oldest first. Empty for a type that is not permitted.
  Future<List<HealthSample>> read(
    HealthDataType type, {
    required DateTime from,
    required DateTime to,
  });

  /// What changed in [type] since [token] was issued. With no token:
  /// every reading there is, and a token to ask with next time. A token
  /// the platform no longer honors gives [HealthChanges.tokenExpired].
  Future<HealthChanges> changesSince(HealthDataType type, String? token);

  /// Writes what was eaten. False when the platform would not take it
  /// (no permission to write, or none to give).
  Future<bool> writeNutrition(NutritionRecord record);
}
