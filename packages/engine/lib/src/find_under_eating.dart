import 'package:mm_domain/mm_domain.dart';

import 'under_eating_finding.dart';
import 'under_eating_rule.dart';
import 'usable_intake_days.dart';

/// A finding when, over the [UnderEatingRule.windowDays] days to [through],
/// at least [UnderEatingRule.minimumDays] whole days average more than 10%
/// below [floorKcal]; otherwise null (MM-114).
///
/// Whole days are those marked complete or passing the expenditure
/// estimate's usable-day rule. Days marked partial and empty days never
/// count, so someone logging only part of what they eat is not told they are
/// under-eating once they say so. It never changes a target.
UnderEatingFinding? findUnderEating({
  required CalendarDate through,
  required List<IntakeDay> intake,
  required double floorKcal,
}) {
  final from = through.addDays(1 - UnderEatingRule.windowDays);
  final window = [
    for (final d in intake)
      if (!d.date.isBefore(from) && !d.date.isAfter(through)) d,
  ];
  final whole = usableIntakeDays(window);
  if (whole.length < UnderEatingRule.minimumDays) return null;
  final average = whole.fold(0.0, (s, d) => s + d.kcal) / whole.length;
  if (average >= floorKcal * (1 - UnderEatingRule.marginBelowFloor)) {
    return null;
  }
  return UnderEatingFinding(
    averageKcal: average,
    floorKcal: floorKcal,
    days: whole.length,
    lowDays: [
      for (final d in whole)
        if (d.kcal < floorKcal) d.date,
    ],
  );
}
