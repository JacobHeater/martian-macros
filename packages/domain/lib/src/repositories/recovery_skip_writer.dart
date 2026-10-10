import '../calendar_date.dart';

/// Records that the recovery check-in was skipped for the week (MM-116).
/// No answers are stored for a skipped week.
abstract interface class RecoverySkipWriter {
  Future<void> saveRecoveryCheckInSkippedOn(CalendarDate day);
}
