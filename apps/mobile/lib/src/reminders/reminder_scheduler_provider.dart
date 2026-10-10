import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'local_notifications_reminder_scheduler.dart';

/// Where reminders are scheduled. Tests replace it with the in-memory one.
final reminderSchedulerProvider = Provider<ReminderScheduler>(
  (ref) => LocalNotificationsReminderScheduler(),
);
