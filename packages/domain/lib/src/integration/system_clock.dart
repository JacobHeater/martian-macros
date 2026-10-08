import '../calendar_date.dart';
import 'clock.dart';

/// The real clock.
final class SystemClock implements Clock {
  const SystemClock();

  @override
  CalendarDate today() => CalendarDate.fromDateTime(now());

  @override
  DateTime now() => DateTime.now();
}
