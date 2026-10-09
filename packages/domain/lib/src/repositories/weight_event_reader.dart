import '../weight_event.dart';

/// Reads user-reported scale-weight events.
abstract interface class WeightEventReader {
  /// Every event, oldest first, then the full list after each change.
  Stream<List<WeightEvent>> watchWeightEvents();
}
