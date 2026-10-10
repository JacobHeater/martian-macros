import '../calendar_date.dart';

/// Reads when the welcome-back screen was last put off (MM-147).
abstract interface class ReturnScreenReader {
  /// The day "Later" was chosen, then each change; null if never.
  Stream<CalendarDate?> watchReturnScreenDismissedOn();
}
