import '../calendar_date.dart';

/// Reads when the recovery check-in was last skipped (MM-116).
abstract interface class RecoverySkipReader {
  /// The day it was skipped, then each change; null if never.
  Stream<CalendarDate?> watchRecoveryCheckInSkippedOn();
}
