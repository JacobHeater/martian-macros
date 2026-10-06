/// A timezone-free calendar day.
///
/// Daily logs, weigh-ins, and engine windows are keyed by the user's local
/// calendar day, not by instants, so DST shifts and travel never split or
/// merge days.
final class CalendarDate implements Comparable<CalendarDate> {
  factory CalendarDate(int year, int month, int day) {
    final utc = DateTime.utc(year, month, day);
    if (utc.year != year || utc.month != month || utc.day != day) {
      throw ArgumentError('Invalid date: $year-$month-$day');
    }
    return CalendarDate.fromEpochDay(
      utc.millisecondsSinceEpoch ~/ Duration.millisecondsPerDay,
    );
  }

  const CalendarDate.fromEpochDay(this.epochDay);

  /// The calendar day of [dateTime] in its own timezone (local or UTC).
  factory CalendarDate.fromDateTime(DateTime dateTime) =>
      CalendarDate(dateTime.year, dateTime.month, dateTime.day);

  /// Parses `YYYY-MM-DD`.
  factory CalendarDate.parse(String iso) {
    final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(iso);
    if (match == null) throw FormatException('Expected YYYY-MM-DD', iso);
    return CalendarDate(
      int.parse(match[1]!),
      int.parse(match[2]!),
      int.parse(match[3]!),
    );
  }

  /// Days since 1970-01-01.
  final int epochDay;

  DateTime get _utc => DateTime.fromMillisecondsSinceEpoch(
    epochDay * Duration.millisecondsPerDay,
    isUtc: true,
  );

  int get year => _utc.year;
  int get month => _utc.month;
  int get day => _utc.day;

  CalendarDate addDays(int days) => CalendarDate.fromEpochDay(epochDay + days);

  /// Signed number of days from this date to [other].
  int daysUntil(CalendarDate other) => other.epochDay - epochDay;

  bool isBefore(CalendarDate other) => epochDay < other.epochDay;
  bool isAfter(CalendarDate other) => epochDay > other.epochDay;

  @override
  int compareTo(CalendarDate other) => epochDay.compareTo(other.epochDay);

  @override
  bool operator ==(Object other) =>
      other is CalendarDate && other.epochDay == epochDay;

  @override
  int get hashCode => epochDay.hashCode;

  @override
  String toString() {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${year.toString().padLeft(4, '0')}-${two(month)}-${two(day)}';
  }
}
