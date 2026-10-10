import 'package:mm_domain/mm_domain.dart';

import 'insight_rule.dart';

/// A record that an insight from [rule] was shown, and when it was dismissed
/// (MM-141). The rationing reads these.
final class InsightLogEntry {
  const InsightLogEntry({
    required this.rule,
    required this.shownOn,
    this.dismissedOn,
  });

  final InsightRule rule;
  final CalendarDate shownOn;
  final CalendarDate? dismissedOn;
}
