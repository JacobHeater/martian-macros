import 'calendar_date.dart';
import 'pause_reason.dart';

/// A stretch of days the user has said will not be tracked: a holiday, an
/// illness, an injury (MM-148). A planned break, not a lapse.
final class Pause {
  const Pause({
    required this.from,
    required this.to,
    required this.reason,
    this.extended = false,
  });

  /// The first and last paused day.
  final CalendarDate from;
  final CalendarDate to;
  final PauseReason reason;

  /// Whether the end date has been moved later; that is allowed once.
  final bool extended;

  int get days => from.daysUntil(to) + 1;

  /// The first day after the pause.
  CalendarDate get resumesOn => to.addDays(1);

  bool covers(CalendarDate date) => !date.isBefore(from) && !date.isAfter(to);

  Pause copyWith({CalendarDate? to, bool? extended}) => Pause(
    from: from,
    to: to ?? this.to,
    reason: reason,
    extended: extended ?? this.extended,
  );
}
