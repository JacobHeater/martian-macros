import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  const model = WeightTrendModel();
  final start = CalendarDate(2026, 1, 1);

  List<WeightObservation> noisyLine({
    required int days,
    required double startKg,
    required double slopeKgPerDay,
    double sigmaKg = 0.6,
    int seed = 1,
  }) {
    final random = math.Random(seed);
    double gauss() =>
        math.sqrt(-2 * math.log(1 - random.nextDouble())) *
        math.cos(2 * math.pi * random.nextDouble());
    return [
      for (var d = 0; d < days; d++)
        WeightObservation(
          date: start.addDays(d),
          weightKg: startKg + slopeKgPerDay * d + gauss() * sigmaKg,
        ),
    ];
  }

  test('returns nothing without observations', () {
    expect(model.smooth(const []), isEmpty);
  });

  test('recovers a steady loss rate through day-to-day water noise', () {
    final trend = model.smooth(
      noisyLine(days: 42, startKg: 90, slopeKgPerDay: -0.08),
    );
    expect(trend, hasLength(42));
    final weekly = trend.last.slopeKgPerDay * 7;
    expect(weekly, closeTo(-0.56, 0.15));
    // Interior smoothed levels are far closer to the truth than a raw
    // weigh-in (sigma 0.6 kg).
    for (final day in [10, 20, 30]) {
      expect(trend[day].levelKg, closeTo(90 - 0.08 * day, 0.3));
    }
  });

  test('treats flat weight as flat', () {
    final trend = model.smooth(
      noisyLine(days: 28, startKg: 80, slopeKgPerDay: 0, seed: 7),
    );
    expect(trend.last.slopeKgPerDay * 7, closeTo(0, 0.2));
  });

  test('rejects a pounds-for-kilograms entry', () {
    final obs = noisyLine(days: 21, startKg: 81.6, slopeKgPerDay: 0)
      ..[10] = WeightObservation(date: start.addDays(10), weightKg: 180);
    final trend = model.smooth(obs);
    expect(trend[10].rejected, isTrue);
    expect(trend[10].observed, isFalse);
    expect(trend[10].levelKg, closeTo(81.6, 0.6));
  });

  test('accepts a real step change after repeated rejections', () {
    final obs = [
      ...noisyLine(days: 14, startKg: 80, slopeKgPerDay: 0),
      for (var d = 14; d < 28; d++)
        WeightObservation(date: start.addDays(d), weightKg: 88),
    ];
    final trend = model.smooth(obs);
    expect(trend.last.levelKg, closeTo(88, 1.0));
    expect(trend.last.rejected, isFalse);
  });

  test('fills gaps and is less certain inside them', () {
    final full = noisyLine(days: 30, startKg: 80, slopeKgPerDay: 0);
    final gapped = [...full]..removeRange(10, 20);
    final withGap = model.smooth(gapped);
    expect(withGap, hasLength(30));
    expect(withGap[15].observed, isFalse);
    expect(
      withGap[15].levelVariance,
      greaterThan(model.smooth(full)[15].levelVariance),
    );
  });

  test('extends through a later date with no weigh-ins', () {
    final trend = model.smooth(
      noisyLine(days: 10, startKg: 80, slopeKgPerDay: 0),
      through: start.addDays(13),
    );
    expect(trend.last.date, start.addDays(13));
  });

  test('noise multiplier reduces the pull of widened days', () {
    final obs = noisyLine(days: 21, startKg: 80, slopeKgPerDay: 0, sigmaKg: 0)
      ..[20] = WeightObservation(date: start.addDays(20), weightKg: 81.5);
    final plain = model.smooth(obs).last.levelKg;
    final widened = model
        .smooth(obs, noiseMultiplier: (d) => d == start.addDays(20) ? 2.0 : 1.0)
        .last
        .levelKg;
    expect(widened, lessThan(plain));
  });
}
