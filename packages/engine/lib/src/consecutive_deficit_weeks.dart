import 'package:mm_domain/mm_domain.dart';

import 'targets_record.dart';

/// Whole weeks the user has been in an unbroken deficit as of [today].
int consecutiveDeficitWeeks(List<TargetsRecord> history, CalendarDate today) {
  CalendarDate? start;
  for (final record in history.reversed) {
    if (record.targets.weeklyRateFraction >= 0) break;
    start = record.effectiveFrom;
  }
  return start == null ? 0 : start.daysUntil(today) ~/ 7;
}
