import '../reminder_setting.dart';

/// Reads reminder settings (MM-146).
abstract interface class ReminderReader {
  /// The stored settings, in the order of `ReminderKind`, then again after
  /// each change. A reminder that was never set is absent.
  Stream<List<ReminderSetting>> watchReminders();
}
