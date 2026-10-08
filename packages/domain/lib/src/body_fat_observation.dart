import 'body_fat_method.dart';
import 'calendar_date.dart';

/// A body-fat estimate from any method. Each device gets its own bias state,
/// so switching scales never reads as a body-composition change.
final class BodyFatObservation {
  const BodyFatObservation({
    required this.date,
    required this.percent,
    required this.method,
    this.deviceId,
  });

  final CalendarDate date;
  final double percent;
  final BodyFatMethod method;
  final String? deviceId;
}
