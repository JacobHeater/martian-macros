import 'calendar_date.dart';
import 'reminder_kind.dart';

/// A reminder due to be shown on [date] at [minuteOfDay], local time
/// (MM-146).
final class PlannedReminder {
  const PlannedReminder({
    required this.kind,
    required this.date,
    required this.minuteOfDay,
  });

  final ReminderKind kind;
  final CalendarDate date;
  final int minuteOfDay;

  @override
  bool operator ==(Object other) =>
      other is PlannedReminder &&
      other.kind == kind &&
      other.date == date &&
      other.minuteOfDay == minuteOfDay;

  @override
  int get hashCode => Object.hash(kind, date, minuteOfDay);

  @override
  String toString() => 'PlannedReminder($kind, $date, $minuteOfDay)';
}
