import '../calendar_date.dart';

/// Records that the welcome-back screen was put off (MM-147).
abstract interface class ReturnScreenWriter {
  Future<void> saveReturnScreenDismissedOn(CalendarDate day);
}
