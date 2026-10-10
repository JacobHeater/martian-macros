import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'reminder_sync_provider.dart';

/// Keeps what the device has scheduled equal to the reminder plan for as
/// long as the app is open (MM-146). The plan is remade whenever a setting
/// or the data behind it changes, so a weigh-in cancels today's prompt.
class ReminderHost extends ConsumerWidget {
  const ReminderHost({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(reminderSyncProvider);
    return child;
  }
}
