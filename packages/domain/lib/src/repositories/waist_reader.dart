import '../waist_observation.dart';

/// Reads waist measurements.
abstract interface class WaistReader {
  /// Every measurement, oldest first, then the full list after each change.
  Stream<List<WaistObservation>> watchWaist();
}
