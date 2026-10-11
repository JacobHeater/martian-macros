import 'package:mm_health_ingest/mm_health_ingest.dart';

/// How the health platform stands for the app right now (MM-68): what it
/// has, what the user allows, and what has been imported of each kind.
final class HealthConnection {
  const HealthConnection({
    required this.available,
    required this.permitted,
    required this.imported,
  });

  /// Empty when the platform is not on this device.
  final Set<HealthDataType> available;
  final Set<HealthDataType> permitted;

  /// The stored readings of each permitted kind.
  final Map<HealthDataType, List<HealthSample>> imported;
}
