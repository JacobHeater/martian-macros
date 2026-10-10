import 'package:mm_domain/mm_domain.dart';

import 'targets_record.dart';

/// Whole weeks the user has been in an unbroken deficit as of [today].
///
/// A gap of two weeks or more with nothing recorded counts as a break
/// (MM-147): the app does not know what was eaten, and assuming the deficit
/// continued would force a diet break on someone who has just had one. Pass
/// the first day back as [restartOn].
int consecutiveDeficitWeeks(
  List<TargetsRecord> history,
  CalendarDate today, {
  CalendarDate? restartOn,
}) {
  CalendarDate? start;
  for (final record in history.reversed) {
    if (record.targets.weeklyRateFraction >= 0) break;
    start = record.effectiveFrom;
  }
  if (start == null) return 0;
  if (restartOn != null && restartOn.isAfter(start)) start = restartOn;
  final days = start.daysUntil(today);
  return days <= 0 ? 0 : days ~/ 7;
}
