import 'package:mm_domain/mm_domain.dart';

/// The pause that covers [date], or null (MM-148).
Pause? pauseOn(Iterable<Pause> pauses, CalendarDate date) {
  for (final pause in pauses) {
    if (pause.covers(date)) return pause;
  }
  return null;
}
