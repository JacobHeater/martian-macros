import 'calendar_date.dart';
import 'reminder_kind.dart';

/// One reminder's setting (MM-146).
final class ReminderSetting {
  const ReminderSetting({
    required this.kind,
    required this.minuteOfDay,
    this.enabled = false,
    this.countFrom,
  });

  final ReminderKind kind;
  final bool enabled;

  /// The local time it is sent, in minutes after midnight.
  final int minuteOfDay;

  /// The day ignored reminders are counted from: the day it was turned on,
  /// or the day the user last chose to keep it. Null while it has never been
  /// on.
  final CalendarDate? countFrom;

  ReminderSetting copyWith({
    bool? enabled,
    int? minuteOfDay,
    CalendarDate? countFrom,
  }) => ReminderSetting(
    kind: kind,
    enabled: enabled ?? this.enabled,
    minuteOfDay: minuteOfDay ?? this.minuteOfDay,
    countFrom: countFrom ?? this.countFrom,
  );
}
