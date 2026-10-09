import '../weight_event.dart';

/// Writes user-reported scale-weight events.
abstract interface class WeightEventWriter {
  /// Adds or replaces the event with the same date and type.
  Future<void> saveWeightEvent(WeightEvent event);

  /// Removes [event] if it is stored.
  Future<void> deleteWeightEvent(WeightEvent event);
}
