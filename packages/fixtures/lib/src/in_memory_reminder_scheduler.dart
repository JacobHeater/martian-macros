import 'package:mm_domain/mm_domain.dart';

/// [ReminderScheduler] that shows nothing and remembers what it was asked
/// to schedule, for tests and demos.
final class InMemoryReminderScheduler implements ReminderScheduler {
  InMemoryReminderScheduler({this.grantPermission = true});

  /// What [requestPermission] answers.
  bool grantPermission;

  /// How many times permission has been asked for.
  int permissionRequests = 0;

  /// What is scheduled now.
  List<PlannedReminder> scheduled = const [];

  @override
  Future<bool> requestPermission() async {
    permissionRequests++;
    return grantPermission;
  }

  @override
  Future<void> replaceAll(List<PlannedReminder> reminders) async {
    scheduled = List.unmodifiable(reminders);
  }
}
