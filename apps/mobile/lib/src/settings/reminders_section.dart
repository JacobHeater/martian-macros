import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/reminder_text.dart';
import '../integration_providers.dart';
import '../providers.dart';
import '../reminders/reminder_scheduler_provider.dart';
import '../repository_role_providers.dart';
import '../ui/group_header.dart';
import '../ui/mm_list_group.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_switch_row.dart';
import '../ui/show_mm_snack_bar.dart';
import '../ui/show_mm_time_picker.dart';

/// The Reminders group of Settings (MM-146). Every reminder is off until the
/// user turns it on, and the phone's permission is asked for only then.
class RemindersSection extends ConsumerWidget {
  const RemindersSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(reminderSettingsProvider);
    final today = ref.watch(todayProvider);
    final writer = ref.read(reminderWriterProvider);
    final messenger = ScaffoldMessenger.of(context);
    String time(int minuteOfDay) => MaterialLocalizations.of(context)
        .formatTimeOfDay(
          TimeOfDay(hour: minuteOfDay ~/ 60, minute: minuteOfDay % 60),
        );

    Future<void> toggle(ReminderSetting setting, bool on) async {
      if (!on) {
        await writer.saveReminder(setting.copyWith(enabled: false));
        return;
      }
      final allowed = await ref
          .read(reminderSchedulerProvider)
          .requestPermission();
      if (!allowed) {
        showMmSnackBar(
          messenger,
          'Notifications are off for this app in your phone’s settings.',
        );
        return;
      }
      await writer.saveReminder(
        setting.copyWith(
          enabled: true,
          countFrom: reminderCountFrom(
            today: today,
            minuteNow: minuteOfDayNow(ref.read(clockProvider)),
            minuteOfDay: setting.minuteOfDay,
          ),
        ),
      );
    }

    Future<void> changeTime(ReminderSetting setting) async {
      final picked = await showMmTimePicker(
        context,
        initialMinuteOfDay: setting.minuteOfDay,
        helpText: '${setting.kind.label} reminder',
      );
      if (picked == null) return;
      if (ReminderRule.isQuiet(picked)) {
        showMmSnackBar(
          messenger,
          'Reminders are not sent between 9 pm and 7 am.',
        );
        return;
      }
      await writer.saveReminder(setting.copyWith(minuteOfDay: picked));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const GroupHeader('Reminders'),
        MmListGroup(
          children: [
            for (final setting in settings) ...[
              MmSwitchRow(
                key: ValueKey('reminder-${setting.kind.name}'),
                title: setting.kind.label,
                subtitle: setting.kind.sentWhen,
                value: setting.enabled,
                onChanged: (on) => toggle(setting, on),
              ),
              if (setting.enabled)
                MmListRow(
                  key: ValueKey('reminder-time-${setting.kind.name}'),
                  dense: true,
                  leadingIcon: Icons.schedule,
                  title: 'At ${time(setting.minuteOfDay)}',
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => changeTime(setting),
                ),
            ],
          ],
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Text(
            'At most two a day, never at night, and never during a pause. A '
            'reminder that goes unanswered for a week stops by itself. '
            'Nothing about your weight or food ever appears in one.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}
