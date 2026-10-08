import '../weight_observation.dart';

/// Reads weigh-ins.
abstract interface class WeightReader {
  /// Every weigh-in, oldest first, then the full list after each change.
  Stream<List<WeightObservation>> watchWeights();
}
