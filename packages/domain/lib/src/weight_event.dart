import 'calendar_date.dart';
import 'weight_event_type.dart';

/// A dated note about a change in scale weight that may not reflect tissue.
final class WeightEvent {
  const WeightEvent({required this.date, required this.type});

  final CalendarDate date;
  final WeightEventType type;
}
