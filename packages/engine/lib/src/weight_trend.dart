import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

/// Smoothed body-weight state for one calendar day.
final class WeightTrendPoint {
  const WeightTrendPoint({
    required this.date,
    required this.levelKg,
    required this.slopeKgPerDay,
    required this.waterKg,
    required this.levelVariance,
    required this.slopeVariance,
    required this.observed,
    required this.rejected,
  });

  final CalendarDate date;

  /// Tissue weight with transient water removed.
  final double levelKg;

  /// Rate of change of [levelKg].
  final double slopeKgPerDay;

  /// Estimated transient water/gut-content offset on this day.
  final double waterKg;

  final double levelVariance;
  final double slopeVariance;

  /// Whether a weigh-in was used on this day.
  final bool observed;

  /// Whether a weigh-in on this day was discarded as an outlier
  /// (typically a unit mix-up or someone else stepping on the scale).
  final bool rejected;

  double get levelSigmaKg => math.sqrt(levelVariance);
}

/// Kalman filter + Rauch-Tung-Striebel smoother over (level, slope, water).
///
/// A weigh-in is `level + water + noise`. Water is an AR(1) process: a salty
/// meal or a hard leg day raises it for a few days, then it decays. Modelling
/// it explicitly stops multi-day water swings being read as tissue change
/// and keeps the reported uncertainty honest. Noise scales with body weight.
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
    final f = _Mat.of(3, [1, 1, 0, 0, 1, 0, 0, 0, phi]);
    final q = _Mat.diagonal([
      _sq(levelProcessSigmaKg),
      _sq(slopeProcessSigmaKgPerDay),
      waterVar * (1 - phi * phi),
    ]);

    final filtered = <_Gaussian>[];
    final predicted = <_Gaussian>[];
    final observed = <bool>[];
    final rejected = <bool>[];
    var rejectionsInARow = 0;

    for (var day = first; day <= last; day++) {
      final date = CalendarDate.fromEpochDay(day);
      final z = byDay[day];

      final _Gaussian prior;
      if (filtered.isEmpty) {
        // First reading: level = z − water − noise, so level and water start
        // perfectly anti-correlated.
        final r = _readingVariance(z!, date, waterVar, noiseMultiplier);
        prior = _Gaussian(
          [z, 0, 0],
          _Mat.of(3, [
            waterVar + r, 0, -waterVar, //
            0, _sq(initialSlopeSigmaKgPerDay), 0,
            -waterVar, 0, waterVar,
          ]),
        );
      } else {
        final x = filtered.last;
        prior = _Gaussian(f.apply(x.mean), f.mul(x.cov).mul(f.t()).add(q));
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
          state = _Gaussian([
            for (var i = 0; i < 3; i++) m[i] + k[i] * innovation,
          ], _Mat.generate(3, (i, j) => p.at(i, j) - k[i] * ph[j]));
        }
      }
      filtered.add(state);
      observed.add(used);
      rejected.add(outlier);
    }

    final smoothed = List<_Gaussian>.of(filtered);
    for (var t = smoothed.length - 2; t >= 0; t--) {
      final fil = filtered[t];
      final next = predicted[t + 1];
      final c = fil.cov.mul(f.t()).mul(next.cov.inverse());
      final dMean = [
        for (var i = 0; i < 3; i++) smoothed[t + 1].mean[i] - next.mean[i],
      ];
      final correction = c.apply(dMean);
      smoothed[t] = _Gaussian([
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

final class _Gaussian {
  const _Gaussian(this.mean, this.cov);

  final List<double> mean;
  final _Mat cov;
}

/// Minimal dense square matrix for the 3-state filter.
final class _Mat {
  _Mat._(this.n, this._v);

  factory _Mat.of(int n, List<double> rowMajor) {
    assert(rowMajor.length == n * n);
    return _Mat._(n, List.of(rowMajor));
  }

  factory _Mat.generate(int n, double Function(int i, int j) f) => _Mat._(n, [
    for (var i = 0; i < n; i++)
      for (var j = 0; j < n; j++) f(i, j),
  ]);

  factory _Mat.diagonal(List<double> d) =>
      _Mat.generate(d.length, (i, j) => i == j ? d[i] : 0);

  final int n;
  final List<double> _v;

  double at(int i, int j) => _v[i * n + j];

  _Mat mul(_Mat o) => _Mat.generate(n, (i, j) {
    var sum = 0.0;
    for (var k = 0; k < n; k++) {
      sum += at(i, k) * o.at(k, j);
    }
    return sum;
  });

  List<double> apply(List<double> x) => [
    for (var i = 0; i < n; i++)
      [for (var k = 0; k < n; k++) at(i, k) * x[k]].fold(0.0, (a, b) => a + b),
  ];

  _Mat add(_Mat o) => _Mat.generate(n, (i, j) => at(i, j) + o.at(i, j));
  _Mat sub(_Mat o) => _Mat.generate(n, (i, j) => at(i, j) - o.at(i, j));
  _Mat t() => _Mat.generate(n, (i, j) => at(j, i));

  /// Gauss-Jordan inverse with partial pivoting.
  _Mat inverse() {
    final a = [
      for (var i = 0; i < n; i++)
        [
          for (var j = 0; j < n; j++) at(i, j),
          for (var j = 0; j < n; j++) i == j ? 1.0 : 0.0,
        ],
    ];
    for (var col = 0; col < n; col++) {
      var pivot = col;
      for (var r = col + 1; r < n; r++) {
        if (a[r][col].abs() > a[pivot][col].abs()) pivot = r;
      }
      final tmp = a[col];
      a[col] = a[pivot];
      a[pivot] = tmp;
      final p = a[col][col];
      if (p == 0) throw StateError('Singular covariance');
      for (var j = 0; j < 2 * n; j++) {
        a[col][j] /= p;
      }
      for (var r = 0; r < n; r++) {
        if (r == col) continue;
        final factor = a[r][col];
        if (factor == 0) continue;
        for (var j = 0; j < 2 * n; j++) {
          a[r][j] -= factor * a[col][j];
        }
      }
    }
    return _Mat.generate(n, (i, j) => a[i][n + j]);
  }
}
