import 'package:mm_domain/mm_domain.dart';

import 'insight.dart';
import 'insight_log_entry.dart';
import 'insight_rationing.dart';
import 'insight_rule.dart';
import 'insight_selection.dart';

/// The one insight to show on [today], or null (MM-141).
///
/// An insight already showing and not dismissed keeps showing while its rule
/// still holds. Otherwise a new one may start: the highest-priority candidate
/// whose rule was not dismissed in the last
/// [InsightRationing.quietDaysAfterDismissal] days, at most one new a day and
/// three a week. [candidates] must be highest priority first.
InsightSelection? selectInsight({
  required List<Insight> candidates,
  required List<InsightLogEntry> log,
  required CalendarDate today,
}) {
  final latest = <InsightRule, InsightLogEntry>{};
  for (final entry in log) {
    final known = latest[entry.rule];
    if (known == null || !entry.shownOn.isBefore(known.shownOn)) {
      latest[entry.rule] = entry;
    }
  }

  for (final candidate in candidates) {
    final entry = latest[candidate.rule];
    if (entry != null && entry.dismissedOn == null) {
      return InsightSelection(candidate, isNew: false);
    }
  }

  final shownToday = log.where((e) => e.shownOn == today).length;
  final shownThisWeek = log.where((e) {
    final age = e.shownOn.daysUntil(today);
    return age >= 0 && age < 7;
  }).length;
  if (shownToday >= InsightRationing.newPerDay ||
      shownThisWeek >= InsightRationing.newPerWeek) {
    return null;
  }

  for (final candidate in candidates) {
    final dismissed = latest[candidate.rule]?.dismissedOn;
    if (dismissed != null &&
        dismissed.daysUntil(today) < InsightRationing.quietDaysAfterDismissal) {
      continue;
    }
    return InsightSelection(candidate, isNew: true);
  }
  return null;
}
