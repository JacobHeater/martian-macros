import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'energy_expenditure.dart';
import 'weight_trend.dart';

enum TdeeStatus {
  /// Enough data: the estimate reflects observed intake and weight change.
  updated,

  /// Not enough usable data in the window; the prior is returned unchanged
  /// and targets must be held, never guessed.
  held,
}

final class TdeeEstimate {
  const TdeeEstimate({
    required this.kcal,
    required this.sigmaKcal,
    required this.status,
    this.usableIntakeDays = 0,
    this.excludedPartialDays = 0,
    this.weighIns = 0,
    this.windowStart,
    this.clampedToBounds = false,
  });

  /// Maintenance intake, in the user's own logging units.
  ///
  /// Consistent logging bias (always under-logging oil, say) is absorbed
  /// here, so targets expressed in the same units still produce the
  /// intended outcome. Weight change is valued in true kcal, so this is
  /// exact once intake is steady at target; the weekly loop converges to
  /// that fixed point.
  final double kcal;
  final double sigmaKcal;
  final TdeeStatus status;
  final int usableIntakeDays;
  final int excludedPartialDays;
  final int weighIns;

  /// First day of the window actually used (later than the nominal window
  /// start when a logging-style switch truncated it).
  final CalendarDate? windowStart;

  /// True if the raw estimate fell outside the plausible range and was
  /// clamped; a strong hint that logging is unreliable.
  final bool clampedToBounds;
}

/// Windowed energy-balance TDEE estimator.
///
/// TDEE = mean intake on usable days − ρ · trend slope, blended with the
/// formula prior by inverse variance. ρ is the energy density of the weight
/// change (see `energyDensityForSlope`).
final class TdeeEstimator {
  const TdeeEstimator({
    this.windowDays = 28,
    this.minSpanDays = 14,
    this.minIntakeDays = 10,
    this.minWeighIns = 8,
    this.partialDayFraction = 0.65,
    this.styleSwitchThreshold = 0.5,
    this.minDaysPerStyleSegment = 7,
    this.minBmrMultiple = 1.1,
    this.maxBmrMultiple = 3.0,
  });

  final int windowDays;

  /// Shortest window (from the first weigh-in, or after a logging-style
  /// switch) that may produce an update.
  final int minSpanDays;

  /// Minimum usable intake days in the window before estimating.
  final int minIntakeDays;

  /// Minimum accepted weigh-ins in the window before estimating.
  final int minWeighIns;

  /// Unmarked days below this fraction of the window's 75th-percentile
  /// intake are treated as partially logged and excluded. Days the user
  /// marks complete (e.g. intentional fasting days) are always used.
  final double partialDayFraction;

  /// A change in mean weighed share larger than this between two halves of
  /// the window counts as a logging-style switch.
  final double styleSwitchThreshold;
  final int minDaysPerStyleSegment;

  final double minBmrMultiple;
  final double maxBmrMultiple;

  /// Estimates TDEE as of [asOf].
  ///
  /// [trend] must be a smoothed series from `WeightTrendModel.smooth` that
  /// covers the window. [energyDensityForSlope] maps a weight slope
  /// (kg/day) to kcal per kg of change.
  TdeeEstimate estimate({
    required CalendarDate asOf,
    required Iterable<IntakeDay> intake,
    required List<WeightTrendPoint> trend,
    required TdeePrior prior,
    required double bmrKcal,
    required double Function(double slopeKgPerDay) energyDensityForSlope,
  }) {
    TdeeEstimate held({int usable = 0, int partial = 0, int weighIns = 0}) =>
        TdeeEstimate(
          kcal: prior.kcal,
          sigmaKcal: prior.sigmaKcal,
          status: TdeeStatus.held,
          usableIntakeDays: usable,
          excludedPartialDays: partial,
          weighIns: weighIns,
        );

    // The window starts no earlier than the first weigh-in, so early
    // check-ins can update from a shorter (but at least minSpanDays) window.
    var start = asOf.addDays(1 - windowDays);
    if (trend.isNotEmpty && trend.first.date.isAfter(start)) {
      start = trend.first.date;
    }
    var days = _daysInWindow(intake, start, asOf);

    final switchDay = _styleSwitch(days);
    if (switchDay != null) {
      start = switchDay;
      days = days.where((d) => !d.date.isBefore(switchDay)).toList();
    }
    if (start.daysUntil(asOf) + 1 < minSpanDays) return held();

    final (usable, partialCount) = _usableDays(days);

    final trendByDay = {for (final p in trend) p.date.epochDay: p};
    final startPoint = trendByDay[start.epochDay];
    final endPoint = trendByDay[asOf.epochDay];
    final weighIns = [
      for (var d = start.epochDay; d <= asOf.epochDay; d++)
        if (trendByDay[d]?.observed ?? false) d,
    ].length;

    if (usable.length < minIntakeDays ||
        weighIns < minWeighIns ||
        startPoint == null ||
        endPoint == null) {
      return held(
        usable: usable.length,
        partial: partialCount,
        weighIns: weighIns,
      );
    }

    final spanDays = start.daysUntil(asOf);
    final slope = (endPoint.levelKg - startPoint.levelKg) / spanDays;
    final slopeVariance =
        (endPoint.levelVariance + startPoint.levelVariance) / _sq(spanDays);
    final rho = energyDensityForSlope(slope);

    final n = usable.length;
    final meanIntake = usable.fold(0.0, (sum, d) => sum + d.kcal) / n;
    // Error in the mean: per-day measurement error, plus sampling error from
    // the window days that weren't usable (finite-population corrected).
    final measurementVar =
        usable.fold(0.0, (sum, d) => sum + _sq(d.kcal * d.relativeSigma)) /
        _sq(n);
    final sampleVar = n < 2
        ? 0.0
        : usable.fold(0.0, (sum, d) => sum + _sq(d.kcal - meanIntake)) /
              (n - 1);
    final windowLength = spanDays + 1;
    final samplingVar = sampleVar / n * (1 - n / windowLength);

    final observedKcal = meanIntake - rho * slope;
    final observedVar = measurementVar + samplingVar + _sq(rho) * slopeVariance;

    final priorVar = _sq(prior.sigmaKcal);
    final posteriorVar = 1 / (1 / observedVar + 1 / priorVar);
    final posterior =
        posteriorVar * (observedKcal / observedVar + prior.kcal / priorVar);

    final lo = bmrKcal * minBmrMultiple;
    final hi = bmrKcal * maxBmrMultiple;
    final clamped = posterior.clamp(lo, hi);

    return TdeeEstimate(
      kcal: clamped,
      sigmaKcal: math.sqrt(posteriorVar),
      status: TdeeStatus.updated,
      usableIntakeDays: n,
      excludedPartialDays: partialCount,
      weighIns: weighIns,
      windowStart: start,
      clampedToBounds: clamped != posterior,
    );
  }

  List<IntakeDay> _daysInWindow(
    Iterable<IntakeDay> intake,
    CalendarDate start,
    CalendarDate end,
  ) =>
      intake
          .where((d) => !d.date.isBefore(start) && !d.date.isAfter(end))
          .toList()
        ..sort((a, b) => a.date.compareTo(b.date));

  /// Splits days into usable intake and a count of excluded partial days.
  (List<IntakeDay>, int) _usableDays(List<IntakeDay> days) {
    final candidates = days
        .where((d) => d.completeness != DayCompleteness.partial)
        .toList();
    if (candidates.isEmpty) return (const [], days.length);

    // The 75th percentile stays inside the fully logged days even when a
    // third of days are partial, unlike the median.
    final typical = _percentile([for (final d in candidates) d.kcal], 0.75);
    final threshold = typical * partialDayFraction;
    final usable = [
      for (final d in candidates)
        if (d.completeness == DayCompleteness.complete ||
            (d.kcal > 0 && d.kcal >= threshold))
          d,
    ];
    return (usable, days.length - usable.length);
  }

  /// The first day of the latest logging-style regime, if the user switched
  /// styles (e.g. hand portions to a food scale) inside the window.
  CalendarDate? _styleSwitch(List<IntakeDay> days) {
    final m = minDaysPerStyleSegment;
    CalendarDate? best;
    var bestChange = styleSwitchThreshold;
    for (var i = m; i <= days.length - m; i++) {
      final change =
          (_meanShare(days.sublist(i)) - _meanShare(days.sublist(0, i))).abs();
      if (change > bestChange) {
        bestChange = change;
        best = days[i].date;
      }
    }
    return best;
  }

  static double _meanShare(List<IntakeDay> days) =>
      days.fold(0.0, (sum, d) => sum + d.weighedShare) / days.length;
}

double _sq(num x) => (x * x).toDouble();

/// Linear-interpolated percentile, [p] in 0–1.
double _percentile(List<double> values, double p) {
  final sorted = [...values]..sort();
  final rank = p * (sorted.length - 1);
  final lo = rank.floor();
  final hi = rank.ceil();
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}
