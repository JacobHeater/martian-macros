import 'package:mm_domain/mm_domain.dart';

import 'activity_gap.dart';
import 'activity_gaps.dart';

/// The gap the user is returning from on [today]: one that runs up to
/// yesterday with nothing recorded today either; otherwise null.
ActivityGap? openGap({
  required Iterable<WeightObservation> weights,
  required Iterable<IntakeDay> intake,
  required CalendarDate today,
}) {
  final gaps = activityGaps(weights: weights, intake: intake, today: today);
  if (gaps.isEmpty) return null;
  final last = gaps.last;
  final activeToday =
      weights.any((w) => w.date == today) ||
      intake.any((d) => d.date == today && d.kcal > 0);
  return last.returnOn == today && !activeToday ? last : null;
}
