import 'package:mm_domain/mm_domain.dart';

import 'insight_rule.dart';

/// Records insights as they are shown and dismissed.
abstract interface class InsightLogWriter {
  /// Records that an insight from [rule] was first shown on [day].
  Future<void> recordInsightShown(InsightRule rule, CalendarDate day);

  /// Marks the latest showing of [rule] as dismissed on [day].
  Future<void> dismissInsight(InsightRule rule, CalendarDate day);
}
