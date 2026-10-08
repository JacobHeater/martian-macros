import 'package:mm_domain/mm_domain.dart';

/// A [Clock] fixed at a day you choose, that you can move.
final class FixedClock implements Clock {
  FixedClock(this._today);

  CalendarDate _today;

  void advanceTo(CalendarDate day) => _today = day;

  @override
  CalendarDate today() => _today;

  @override
  DateTime now() => DateTime(_today.year, _today.month, _today.day, 12);
}
