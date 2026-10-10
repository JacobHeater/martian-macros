import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mm_engine/mm_engine.dart';

import '../format/reminder_text.dart';
import '../integration_providers.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';

/// One line when a reminder has gone unanswered seven times and paused
/// itself (MM-146): keep it or turn it off. It never escalates or changes
/// tone. Empty when no reminder is paused.
class ReminderPausedNotice extends ConsumerWidget {
  const ReminderPausedNotice({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paused = ref.watch(selfPausedRemindersProvider);
    if (paused.isEmpty) return const SizedBox.shrink();
    final setting = paused.first;
    final writer = ref.read(reminderWriterProvider);
    final today = ref.watch(todayProvider);
    return Padding(
      key: const ValueKey('reminder-paused-notice'),
      padding: const EdgeInsets.only(bottom: 12),
      child: Notice(
        icon: Icons.notifications_paused_outlined,
        text: '${setting.kind.pausedLine} Keep them or turn them off?',
        action: Wrap(
          spacing: 8,
          children: [
            MmButton(
              key: const ValueKey('reminder-keep'),
              label: 'Keep',
              kind: MmButtonKind.secondary,
              onPressed: () => writer.saveReminder(
                setting.copyWith(
                  countFrom: reminderCountFrom(
                    today: today,
                    minuteNow: minuteOfDayNow(ref.read(clockProvider)),
                    minuteOfDay: setting.minuteOfDay,
                  ),
                ),
              ),
            ),
            MmButton(
              key: const ValueKey('reminder-turn-off'),
              label: 'Turn off',
              kind: MmButtonKind.text,
              onPressed: () =>
                  writer.saveReminder(setting.copyWith(enabled: false)),
            ),
          ],
        ),
      ),
    );
  }
}
