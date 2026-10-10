import '../calendar_date.dart';

/// Reads when the under-eating notice was last dismissed (MM-114).
abstract interface class UnderEatingNoticeReader {
  /// The day it was dismissed, then each change; null if never.
  Stream<CalendarDate?> watchUnderEatingDismissedOn();
}
