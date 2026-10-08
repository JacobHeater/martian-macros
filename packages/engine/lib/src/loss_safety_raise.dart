import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'body_fat_estimate.dart';
import 'coach_constants.dart';
import 'partition.dart';
import 'safety_bounds.dart';
import 'settling_windows.dart';
import 'targets_record.dart';
import 'weight_trend_point.dart';

/// How many kcal a day to add to the target now, because the user is losing
/// weight faster than the fastest pace allowed for their body fat (MM-115).
/// Zero when the pace is within the limit or the evidence is not clear.
///
/// "Clear" means all of: today is outside the settling window after a change
/// of intake level (early loss is glycogen and water, MM-131); at least
/// [safetyRaiseMinWeighIns] weigh-ins were used in the last
/// [safetyRaiseLookbackDays] days, not counting those inside a settling
/// window; and the trend's loss pace, less [safetyRaiseSigmas] of its own
/// standard deviations, still exceeds the limit. The pace is the trend
/// model's current slope, which already smooths over the recent weigh-ins.
///
/// The raise is the energy that brings the pace back to the limit, valued
/// with the same lean/fat partition as targets, and capped at
/// [safetyRaiseCapKcal] per check-in.
double lossSafetyRaiseKcal({
  required List<WeightTrendPoint> trend,
  required List<TargetsRecord> history,
  required BiologicalSex sex,
  required BodyFatEstimate bodyFat,
  required double safetyBodyFatPercent,
  required bool resistanceTrained,
}) {
  if (trend.isEmpty) return 0;
  final last = trend.last;
  final windows = settlingWindows(history);
  bool settling(CalendarDate day) => windows.any((w) => w.contains(day));
  if (settling(last.date)) return 0;

  final from = last.date.addDays(-(safetyRaiseLookbackDays - 1));
  final weighIns = trend
      .where((p) => p.observed && !p.date.isBefore(from) && !settling(p.date))
      .length;
  if (weighIns < safetyRaiseMinWeighIns) return 0;

  final level = last.levelKg;
  final limit = SafetyBounds.maxWeeklyLossFraction(sex, safetyBodyFatPercent);
  final loss = -last.slopeKgPerDay * 7 / level;
  final sigma = math.sqrt(last.slopeVariance) * 7 / level;
  if (loss - safetyRaiseSigmas * sigma <= limit) return 0;

  final density = energyDensityForSlope(
    slopeKgPerDay: last.slopeKgPerDay,
    fatMassKg: bodyFat.fatMassKg(level),
    resistanceTrained: resistanceTrained,
  );
  final excessKgPerWeek = (loss - limit) * level;
  return math.min(safetyRaiseCapKcal, excessKgPerWeek * density / 7);
}
