import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers.dart';
import 'reminder_scheduler_provider.dart';

/// Hands each new reminder plan to the scheduler (MM-146). Until a reminder
/// has been set there is no plan and the scheduler is never touched.
final reminderSyncProvider = Provider<void>((ref) {
  final plan = ref.watch(reminderPlanProvider);
  if (plan != null) ref.watch(reminderSchedulerProvider).replaceAll(plan);
});
