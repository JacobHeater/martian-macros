import 'calendar_date.dart';

/// A day with menstrual flow recorded. Used to widen weight and BIA noise
/// around menses rather than mistaking water shifts for tissue change.
final class MenstruationDay {
  const MenstruationDay(this.date);

  final CalendarDate date;
}
