import 'insight_priority.dart';

/// The catalog of insight rules (MM-141). Every insight comes from one of
/// these; there is no text generated at run time.
enum InsightRule {
  /// The log is thin in a way that limits the coach: many partial days.
  partialDays(InsightPriority.dataQuality),

  /// More than half the calories come from estimated entries (MM-150).
  estimatesRising(InsightPriority.dataQuality),

  /// Fewer than four weigh-ins a week.
  weighInTiming(InsightPriority.dataQuality, aboutWeight: true),

  /// Progress has stalled, with its diagnosis (MM-140).
  stall(InsightPriority.coaching, aboutWeight: true),

  /// The protein minimum is met on fewer than half of whole days (MM-121).
  proteinShort(InsightPriority.pattern);

  const InsightRule(this.priority, {this.aboutWeight = false});

  final InsightPriority priority;

  /// Suppressed entirely for a user with an eating-disorder history.
  final bool aboutWeight;
}
