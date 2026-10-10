import '../reminder_setting.dart';

/// Writes reminder settings (MM-146).
abstract interface class ReminderWriter {
  /// Adds [setting], or replaces the one of the same kind.
  Future<void> saveReminder(ReminderSetting setting);
}
