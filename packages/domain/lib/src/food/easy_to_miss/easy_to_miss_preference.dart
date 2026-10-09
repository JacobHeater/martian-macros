import '../../calendar_date.dart';

/// The user's setting for the easy-to-miss line, and when it was last shown
/// (MM-152). Not health data; it lives with the display preferences.
final class EasyToMissPreference {
  const EasyToMissPreference({this.enabled = true, this.lastShown});

  /// The line is on unless the user turns it off.
  final bool enabled;

  /// The last day the line was shown, or null if never.
  final CalendarDate? lastShown;
}
