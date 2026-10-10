import 'package:mm_domain/mm_domain.dart';

import 'recovery_rule.dart';

/// Whether to offer the weekly recovery check-in on [today] (MM-116): from a
/// week after setup, when it has been neither answered nor skipped in the
/// last [RecoveryRule.everyDays] days, and not during a pause (MM-148).
bool recoveryCheckInDue({
  required CalendarDate today,
  required CalendarDate onboardedOn,
  required Iterable<RecoveryCheckIn> checkIns,
  required CalendarDate? skippedOn,
  bool paused = false,
}) {
  if (paused) return false;
  if (onboardedOn.daysUntil(today) < RecoveryRule.everyDays) return false;
  bool recent(CalendarDate day) =>
      !day.isAfter(today) && day.daysUntil(today) < RecoveryRule.everyDays;
  if (skippedOn != null && recent(skippedOn)) return false;
  return !checkIns.any((c) => recent(c.date));
}
