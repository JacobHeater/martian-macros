import 'personal_record.dart';
import 'strength_trend.dart';

/// The personal records in the strength history (MM-92), by the id of the
/// workout that set them.
///
/// A session sets a record when its best estimated one-rep max is higher
/// than that of every earlier session of the lift. A lift's first session
/// sets none: there is nothing to beat. A record stays one when a later
/// session beats it; it was the best on its day. Each session's own
/// estimate is used, not the smoothed trend, which would lag the day the
/// work was done.
Map<int, List<PersonalRecord>> personalRecordsOf(
  Iterable<StrengthTrend> trends,
) {
  final records = <int, List<PersonalRecord>>{};
  for (final trend in trends) {
    double? best;
    for (final point in trend.points) {
      final before = best;
      if (before != null && point.estimateKg > before) {
        records
            .putIfAbsent(point.workoutId, () => [])
            .add(
              PersonalRecord(
                exerciseId: trend.exerciseId,
                name: trend.name,
                estimateKg: point.estimateKg,
                previousBestKg: before,
              ),
            );
      }
      if (before == null || point.estimateKg > before) best = point.estimateKg;
    }
  }
  return records;
}
