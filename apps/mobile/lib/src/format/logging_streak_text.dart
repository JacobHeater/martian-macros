import 'package:mm_engine/mm_engine.dart';

/// The quiet line about the logging streak (MM-92), or null when there is
/// nothing to say. It counts the work and nothing else: never how much was
/// eaten, never weight, never "under target".
String? loggingStreakText(LoggingStreak streak) {
  if (streak.days < StreakRule.showFromDays) return null;
  final base = '${streak.days} whole days logged in a row.';
  return streak.forgivenOn == null
      ? base
      : '$base A missed day is forgiven, once a week.';
}
