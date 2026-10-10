import 'package:mm_domain/mm_domain.dart';

/// A [Clock] fixed at a day you choose, that you can move.
final class FixedClock implements Clock {
  FixedClock(this._today, {this.hour = 12});

  CalendarDate _today;

  /// The hour of the day [now] reports. Noon unless a test is about the time
  /// of day.
  final int hour;

  void advanceTo(CalendarDate day) => _today = day;

  @override
  CalendarDate today() => _today;

  @override
  DateTime now() => DateTime(_today.year, _today.month, _today.day, hour);
}
