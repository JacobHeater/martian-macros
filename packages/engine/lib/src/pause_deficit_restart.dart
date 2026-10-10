import 'package:mm_domain/mm_domain.dart';

import 'pause_rule.dart';

/// The day the unbroken-deficit count restarts because of a pause, or null
/// (MM-148). A pause of [PauseRule.deficitBreakDays] days or more is a diet
/// break: the count restarts on the first day after it, or today while it is
/// still running and that many days of it have passed.
CalendarDate? pauseDeficitRestartOn(
  Iterable<Pause> pauses,
  CalendarDate today,
) {
  CalendarDate? latest;
  for (final pause in pauses) {
    if (pause.from.isAfter(today)) continue;
    final ended = pause.to.isBefore(today);
    final elapsed = ended ? pause.days : pause.from.daysUntil(today) + 1;
    if (elapsed < PauseRule.deficitBreakDays) continue;
    final restart = ended ? pause.resumesOn : today;
    if (latest == null || restart.isAfter(latest)) latest = restart;
  }
  return latest;
}
