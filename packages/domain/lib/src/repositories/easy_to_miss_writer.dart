import '../calendar_date.dart';

/// Writes the setting for the easy-to-miss line.
abstract interface class EasyToMissWriter {
  Future<void> saveEasyToMissEnabled(bool enabled);

  /// Records that the line was shown on [day].
  Future<void> markEasyToMissShown(CalendarDate day);
}
