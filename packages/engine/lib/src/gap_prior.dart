import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'activity_gap.dart';
import 'gap_rule.dart';
import 'targets_record.dart';
import 'tdee_prior.dart';
import 'tdee_status.dart';
import 'weight_trend_point.dart';

/// The starting estimate after a gap (MM-147), or null when the usual prior
/// applies.
///
/// Expenditure changes slowly, so a hard-won measurement is kept, not
/// discarded: after a gap of four weeks or more whose end still falls inside
/// the estimation window, the last measured expenditure becomes the starting
/// estimate with its uncertainty widened to 10%. If weight changed by more
/// than 5% across a gap of any length, that figure is first moved by the
/// change in resting energy, since it is then clearly stale.
TdeePrior? gapPrior({
  required List<ActivityGap> gaps,
  required List<TargetsRecord> history,
  required List<WeightTrendPoint> trend,
  required CalendarDate asOf,
  required int windowDays,
  required int profileRevision,
  required double Function(double weightKg) restingEnergyAt,
}) {
  final windowStart = asOf.addDays(1 - windowDays);
  final recent = gaps.where((g) => !g.to.isBefore(windowStart));
  if (recent.isEmpty || trend.isEmpty) return null;
  final gap = recent.last;

  final before = trend.where((p) => p.date.isBefore(gap.from));
  if (before.isEmpty) return null;
  final weightBefore = before.last.levelKg;
  final weightNow = trend.last.levelKg;
  final changed =
      (weightNow / weightBefore - 1).abs() > GapRule.rescaleWeightChange;
  if (gap.days < GapRule.recalibrateDays && !changed) return null;

  final measured = history.where(
    (r) =>
        !r.effectiveFrom.isAfter(gap.from) &&
        r.profileRevision == profileRevision &&
        r.tdeeStatus == TdeeStatus.updated,
  );
  if (measured.isEmpty) return null;
  final last = measured.last;
  final kcal = changed
      ? last.tdeeKcal +
            restingEnergyAt(weightNow) -
            restingEnergyAt(weightBefore)
      : last.tdeeKcal;
  return TdeePrior(
    kcal: kcal,
    sigmaKcal: math.max(
      last.tdeeSigmaKcal,
      kcal * GapRule.recalibrateSigmaFraction,
    ),
  );
}
