import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:timezone/timezone.dart' as tz;

import '../format/reminder_text.dart';

/// [ReminderScheduler] over the device's own scheduled notifications
/// (MM-146). Nothing here uses the network: no push service and no token.
final class LocalNotificationsReminderScheduler implements ReminderScheduler {
  LocalNotificationsReminderScheduler();

  final _plugin = FlutterLocalNotificationsPlugin();
  Future<void>? _ready;

  /// Initialising asks for nothing: permission is requested only when the
  /// user turns a reminder on.
  Future<void> _initialize() => _ready ??= _plugin.initialize(
    settings: const InitializationSettings(
      android: AndroidInitializationSettings('ic_stat_reminder'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: false,
        requestSoundPermission: false,
        requestBadgePermission: false,
      ),
    ),
  );

  @override
  Future<bool> requestPermission() async {
    await _initialize();
    return switch (defaultTargetPlatform) {
      TargetPlatform.android =>
        await _plugin
                .resolvePlatformSpecificImplementation<
                  AndroidFlutterLocalNotificationsPlugin
                >()
                ?.requestNotificationsPermission() ??
            false,
      TargetPlatform.iOS =>
        await _plugin
                .resolvePlatformSpecificImplementation<
                  IOSFlutterLocalNotificationsPlugin
                >()
                ?.requestPermissions(alert: true, sound: true) ??
            false,
      _ => false,
    };
  }

  @override
  Future<void> replaceAll(List<PlannedReminder> reminders) async {
    await _initialize();
    await _plugin.cancelAll();
    for (final (index, reminder) in reminders.indexed) {
      final date = reminder.date;
      // The local wall-clock time, handed over as an instant.
      final at = DateTime(
        date.year,
        date.month,
        date.day,
        reminder.minuteOfDay ~/ 60,
        reminder.minuteOfDay % 60,
      );
      await _plugin.zonedSchedule(
        id: index,
        // The prompt is the whole notification: no weight, calories, target
        // or streak ever appears on a lock screen.
        title: reminder.kind.prompt,
        scheduledDate: tz.TZDateTime.from(at, tz.UTC),
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
            'reminders',
            'Reminders',
            channelDescription: 'The reminders you turn on in Settings.',
          ),
          iOS: DarwinNotificationDetails(),
        ),
        // Inexact: a reminder a few minutes late needs no special permission.
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      );
    }
  }
}
