import 'package:mm_domain/mm_domain.dart';

/// How many days from [from] to [to], both included, are paused (MM-148).
int pausedDaysBetween(
  Iterable<Pause> pauses,
  CalendarDate from,
  CalendarDate to,
) {
  final days = <int>{};
  for (final pause in pauses) {
    final start = pause.from.isBefore(from) ? from : pause.from;
    final end = pause.to.isAfter(to) ? to : pause.to;
    for (var d = start.epochDay; d <= end.epochDay; d++) {
      days.add(d);
    }
  }
  return days.length;
}
