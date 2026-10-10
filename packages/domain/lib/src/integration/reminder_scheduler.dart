import '../planned_reminder.dart';

/// Shows reminders on the device at their times (MM-146). Local only: no
/// push service, no token, nothing leaves the device.
abstract interface class ReminderScheduler {
  /// Asks the system for permission to show notifications. True when it is
  /// granted. Called only when the user turns a reminder on.
  Future<bool> requestPermission();

  /// Cancels everything scheduled before and schedules exactly [reminders].
  Future<void> replaceAll(List<PlannedReminder> reminders);
}
