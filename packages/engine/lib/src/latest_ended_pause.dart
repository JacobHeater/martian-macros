import 'package:mm_domain/mm_domain.dart';

/// The pause that ended most recently before [today], or null (MM-148).
Pause? latestEndedPause(Iterable<Pause> pauses, CalendarDate today) {
  Pause? latest;
  for (final pause in pauses) {
    if (!pause.to.isBefore(today)) continue;
    if (latest == null || pause.to.isAfter(latest.to)) latest = pause;
  }
  return latest;
}
