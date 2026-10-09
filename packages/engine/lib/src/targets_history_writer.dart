import 'package:mm_domain/mm_domain.dart';

import 'targets_record.dart';

/// Records a set of targets as issued.
abstract interface class TargetsHistoryWriter {
  /// Saves [record]; a record already effective from the same day is replaced.
  Future<void> saveTargets(TargetsRecord record);

  /// Marks summaries for target changes through [effectiveFrom] as shown.
  Future<void> markSummariesSeenThrough(CalendarDate effectiveFrom);
}
