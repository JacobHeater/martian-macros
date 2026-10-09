import '../../calendar_date.dart';
import 'easy_to_miss_preference.dart';

/// How many days the line is shown every time a day is marked complete.
const easyToMissDailyDays = 14;

/// How many days apart it is shown after that.
const easyToMissWeeklyGap = 7;

/// Whether the easy-to-miss line should be shown under a day that is marked
/// complete (MM-152).
///
/// It is shown every time during the first [easyToMissDailyDays] days of use,
/// and after that once a week, on the first completed day in a week. It stays
/// visible for the rest of the day it first appeared on. It is never shown when
/// the user turned it off, or when [suppressed]: for someone with an
/// eating-disorder history, or with the under-eating notice active, a prompt
/// to find more to record is the wrong emphasis.
bool easyToMissVisible({
  required CalendarDate today,
  required CalendarDate onboardedOn,
  required EasyToMissPreference preference,
  bool suppressed = false,
}) {
  if (!preference.enabled || suppressed) return false;
  final lastShown = preference.lastShown;
  if (lastShown == today) return true;
  final dayOfUse = onboardedOn.daysUntil(today) + 1;
  if (dayOfUse <= easyToMissDailyDays) return true;
  return lastShown == null || lastShown.daysUntil(today) >= easyToMissWeeklyGap;
}
