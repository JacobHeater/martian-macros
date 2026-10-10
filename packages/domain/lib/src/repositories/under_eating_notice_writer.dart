import '../calendar_date.dart';

/// Records that the under-eating notice was dismissed (MM-114).
abstract interface class UnderEatingNoticeWriter {
  Future<void> saveUnderEatingDismissedOn(CalendarDate day);
}
