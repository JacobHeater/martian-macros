import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'gaussian.dart';
import 'mat.dart';
import 'trend_shift.dart';
import 'weight_trend_point.dart';

final class WeightTrendModel {
  const WeightTrendModel({
    this.relativeWaterSigma = 0.006,
    this.waterPersistence = 0.65,
    this.relativeScaleSigma = 0.002,
    this.levelProcessSigmaKg = 0.02,
    this.slopeProcessSigmaKgPerDay = 0.003,
    this.initialSlopeSigmaKgPerDay = 0.1,
    this.outlierSigmas = 5,
    this.maxConsecutiveRejections = 3,
  });

  /// Stationary one-sigma water fluctuation as a fraction of body weight.
  final double relativeWaterSigma;

  /// Day-to-day autocorrelation of the water offset (0 = independent).
  final double waterPersistence;

  /// One-sigma independent reading noise (scale, clothing, timing).
  final double relativeScaleSigma;

  final double levelProcessSigmaKg;
  final double slopeProcessSigmaKgPerDay;
  final double initialSlopeSigmaKgPerDay;

  /// Innovations beyond this many sigmas are rejected as outliers.
  final double outlierSigmas;

  /// After this many rejections in a row the next reading is accepted
  /// anyway: a real step change (e.g. after a long gap) must not be locked
  /// out forever.
  final int maxConsecutiveRejections;

  /// Returns one point per calendar day from the first weigh-in through
  /// [through] (default: the last weigh-in). Empty if there are none.
  ///
  /// When several observations share a day the first is used; ingestion is
  /// responsible for choosing the day's canonical reading. [noiseMultiplier]
  /// marks days with extra transient water (e.g. `cycleNoiseMultiplier`).
  List<WeightTrendPoint> smooth(
    Iterable<WeightObservation> observations, {
    CalendarDate? through,
    double Function(CalendarDate date)? noiseMultiplier,
    TrendShift? Function(CalendarDate date)? shift,
  }) {
    final byDay = <int, double>{};
    for (final o in observations) {
      byDay.putIfAbsent(o.date.epochDay, () => o.weightKg);
    }
    if (byDay.isEmpty) return const [];

    final days = byDay.keys.toList()..sort();
    final first = days.first;
    final last = through?.epochDay ?? days.last;
    if (last < first) return const [];

    final reference = byDay[first]!;
    final waterVar = _sq(relativeWaterSigma * reference);
    final phi = waterPersistence;
    final f = Mat.of(3, [1, 1, 0, 0, 1, 0, 0, 0, phi]);
    final q = Mat.diagonal([
      _sq(levelProcessSigmaKg),
      _sq(slopeProcessSigmaKgPerDay),
      waterVar * (1 - phi * phi),
    ]);

    final filtered = <Gaussian>[];
    final predicted = <Gaussian>[];
    final observed = <bool>[];
    final rejected = <bool>[];
    var rejectionsInARow = 0;

    for (var day = first; day <= last; day++) {
      final date = CalendarDate.fromEpochDay(day);
      final z = byDay[day];

      final Gaussian prior;
      if (filtered.isEmpty) {
        // First reading: level = z − water − noise, so level and water start
        // perfectly anti-correlated.
        final r = _readingVariance(z!, date, waterVar, noiseMultiplier);
        prior = Gaussian(
          [z, 0, 0],
          Mat.of(3, [
            waterVar + r, 0, -waterVar, //
            0, _sq(initialSlopeSigmaKgPerDay), 0,
            -waterVar, 0, waterVar,
          ]),
        );
      } else {
        final x = filtered.last;
        // A day that may carry a shift lets level and slope move freely,
        // so a step is not smeared into the slope and a change of pace is
        // not resisted for weeks.
        final extra = shift?.call(date);
        final qDay = extra == null
            ? q
            : q.add(
                Mat.diagonal([
                  _sq(extra.levelSigmaKg),
                  _sq(extra.slopeSigmaKgPerDay),
                  0,
                ]),
              );
        prior = Gaussian(f.apply(x.mean), f.mul(x.cov).mul(f.t()).add(qDay));
      }
      predicted.add(prior);

      var state = prior;
      var used = false;
      var outlier = false;
      if (z != null) {
        final r = _readingVariance(z, date, waterVar, noiseMultiplier);
        // H = [1, 0, 1]
        final m = prior.mean;
        final p = prior.cov;
        final innovation = z - (m[0] + m[2]);
        final ph = [for (var i = 0; i < 3; i++) p.at(i, 0) + p.at(i, 2)];
        final s = ph[0] + ph[2] + r;
        final isOutlier =
            filtered.isNotEmpty &&
            innovation.abs() > outlierSigmas * math.sqrt(s) &&
            rejectionsInARow < maxConsecutiveRejections;
        if (isOutlier) {
          outlier = true;
          rejectionsInARow++;
        } else {
          rejectionsInARow = 0;
          used = true;
          final k = [for (final v in ph) v / s];
          state = Gaussian([
            for (var i = 0; i < 3; i++) m[i] + k[i] * innovation,
          ], Mat.generate(3, (i, j) => p.at(i, j) - k[i] * ph[j]));
        }
      }
      filtered.add(state);
      observed.add(used);
      rejected.add(outlier);
    }

    final smoothed = List<Gaussian>.of(filtered);
    for (var t = smoothed.length - 2; t >= 0; t--) {
      final fil = filtered[t];
      final next = predicted[t + 1];
      final c = fil.cov.mul(f.t()).mul(next.cov.inverse());
      final dMean = [
        for (var i = 0; i < 3; i++) smoothed[t + 1].mean[i] - next.mean[i],
      ];
      final correction = c.apply(dMean);
      smoothed[t] = Gaussian([
        for (var i = 0; i < 3; i++) fil.mean[i] + correction[i],
      ], fil.cov.add(c.mul(smoothed[t + 1].cov.sub(next.cov)).mul(c.t())));
    }

    return [
      for (var i = 0; i < smoothed.length; i++)
        WeightTrendPoint(
          date: CalendarDate.fromEpochDay(first + i),
          levelKg: smoothed[i].mean[0],
          slopeKgPerDay: smoothed[i].mean[1],
          waterKg: smoothed[i].mean[2],
          levelVariance: smoothed[i].cov.at(0, 0),
          slopeVariance: smoothed[i].cov.at(1, 1),
          observed: observed[i],
          rejected: rejected[i],
        ),
    ];
  }

  /// Independent variance of one reading. On widened days the extra
  /// transient water is added as reading noise rather than tissue signal.
  double _readingVariance(
    double weightKg,
    CalendarDate date,
    double waterVar,
    double Function(CalendarDate)? noiseMultiplier,
  ) {
    final multiplier = noiseMultiplier?.call(date) ?? 1;
    return _sq(relativeScaleSigma * weightKg) +
        (multiplier * multiplier - 1) * waterVar;
  }
}

double _sq(double x) => x * x;
