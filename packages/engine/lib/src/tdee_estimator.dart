import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'settling_window.dart';
import 'tdee_estimate.dart';
import 'tdee_prior.dart';
import 'tdee_status.dart';
import 'weight_trend_point.dart';

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
    List<SettlingWindow> settling = const [],
  }) {
    TdeeEstimate held({
      int usable = 0,
      int partial = 0,
      int weighIns = 0,
      CalendarDate? settlingUntil,
    }) => TdeeEstimate(
      kcal: prior.kcal,
      sigmaKcal: prior.sigmaKcal,
      status: TdeeStatus.held,
      usableIntakeDays: usable,
      excludedPartialDays: partial,
      weighIns: weighIns,
      settlingUntil: settlingUntil,
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

    // Stretches of the window outside every settling window. Weight change
    // is summed over these only.
    final segments = _cleanSegments(start, asOf, settling);
    final spanDays = segments.fold(0, (sum, s) => sum + s.$1.daysUntil(s.$2));
    if (spanDays + 1 < minSpanDays) {
      // Only settling windows can have shortened the span.
      final ends = [
        for (final w in settling)
          if (!w.end.isBefore(start) && !w.start.isAfter(asOf)) w.end,
      ]..sort();
      return held(settlingUntil: ends.last);
    }
    bool clean(CalendarDate day) =>
        segments.any((s) => !day.isBefore(s.$1) && !day.isAfter(s.$2));
    days = days.where((d) => clean(d.date)).toList();

    final (usable, partialCount) = _usableDays(days);

    final trendByDay = {for (final p in trend) p.date.epochDay: p};
    final weighIns = [
      for (final (from, to) in segments)
        for (var d = from.epochDay; d <= to.epochDay; d++)
          if (trendByDay[d]?.observed ?? false) d,
    ].length;
    final ends = [
      for (final (from, to) in segments)
        (trendByDay[from.epochDay], trendByDay[to.epochDay]),
    ];

    if (usable.length < minIntakeDays ||
        weighIns < minWeighIns ||
        ends.any((e) => e.$1 == null || e.$2 == null)) {
      return held(
        usable: usable.length,
        partial: partialCount,
        weighIns: weighIns,
      );
    }

    final slope =
        ends.fold(0.0, (sum, e) => sum + e.$2!.levelKg - e.$1!.levelKg) /
        spanDays;
    final slopeVariance =
        ends.fold(
          0.0,
          (sum, e) => sum + e.$2!.levelVariance + e.$1!.levelVariance,
        ) /
        _sq(spanDays);
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
    final windowLength = spanDays + segments.length;
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

  /// [start]..[end] with every settling window cut out. A piece runs from
  /// the day after one window to the first day of the next, whose morning
  /// weigh-in precedes the change. Pieces of a single day carry no weight
  /// change and are dropped.
  List<(CalendarDate, CalendarDate)> _cleanSegments(
    CalendarDate start,
    CalendarDate end,
    List<SettlingWindow> settling,
  ) {
    final windows = [
      for (final w in settling)
        if (!w.end.isBefore(start) && !w.start.isAfter(end)) w,
    ]..sort((a, b) => a.start.compareTo(b.start));
    final segments = <(CalendarDate, CalendarDate)>[];
    var from = start;
    for (final w in windows) {
      if (w.start.isAfter(from)) segments.add((from, w.start));
      final next = w.end.addDays(1);
      if (next.isAfter(from)) from = next;
    }
    if (end.isAfter(from)) segments.add((from, end));
    return segments;
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
