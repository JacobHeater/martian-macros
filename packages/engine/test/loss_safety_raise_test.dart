import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/trend_points.dart';

/// MM-115: when loss outruns the limit, raise calories now.
void main() {
  final start = CalendarDate(2026, 1, 1);
  const bodyFat25 = BodyFatEstimate(percent: 25, sigmaPercent: 3);
  const bodyFat11 = BodyFatEstimate(percent: 11, sigmaPercent: 3);

  double raise({
    required List<WeightTrendPoint> trend,
    List<TargetsRecord> history = const [],
    BodyFatEstimate bodyFat = bodyFat25,
  }) => lossSafetyRaiseKcal(
    trend: trend,
    history: history,
    sex: BiologicalSex.male,
    bodyFat: bodyFat,
    resistanceTrained: true,
  );

  test('a clear loss over the limit raises the target by the excess', () {
    // 1.2% a week against a 1.0% limit at 25% body fat: 0.2% of 90 kg is
    // 0.18 kg a week, about 8,200 kcal a kg, so about 210 kcal a day.
    final kcal = raise(
      trend: trendOf(start: start, lossFractionPerWeek: 0.012),
    );
    expect(kcal, inInclusiveRange(150, 260));
  });

  test('a loss within the limit raises nothing', () {
    expect(raise(trend: trendOf(start: start, lossFractionPerWeek: 0.009)), 0);
  });

  test('one raise is capped at 400 kcal', () {
    expect(raise(trend: trendOf(start: start, lossFractionPerWeek: 0.02)), 400);
  });

  test('the first week of a deficit does not count', () {
    // A deficit began 8 days before the last trend day (a 1.8 kg drop in
    // the first 8 days is glycogen and water).
    final history = [deficitStartingOn(start.addDays(13))];
    expect(
      raise(
        trend: trendOf(start: start, lossFractionPerWeek: 0.02),
        history: history,
      ),
      0,
    );
  });

  test('days just after the settling window are not enough yet', () {
    // The window covers days 8 to 17; only 4 weigh-ins in the last 14 days
    // fall outside it.
    final history = [deficitStartingOn(start.addDays(8))];
    expect(
      raise(
        trend: trendOf(start: start, lossFractionPerWeek: 0.02),
        history: history,
      ),
      0,
    );
  });

  test('once enough weigh-ins fall outside the window, it counts', () {
    final history = [deficitStartingOn(start)];
    expect(
      raise(
        trend: trendOf(start: start, lossFractionPerWeek: 0.02),
        history: history,
      ),
      greaterThan(0),
    );
  });

  test('too few weigh-ins is not clear enough', () {
    // A weigh-in every third day: 5 or fewer in the last 14 days.
    expect(
      raise(
        trend: trendOf(
          start: start,
          lossFractionPerWeek: 0.013,
          observedEvery: 3,
        ),
      ),
      0,
    );
  });

  test(
    'a pace that is not clearly over its own uncertainty raises nothing',
    () {
      // 1.3% a week, but the pace is uncertain by 0.5% a week: 1.3 - 1.5 x
      // 0.5 is below the 1.0% limit.
      expect(
        raise(
          trend: trendOf(
            start: start,
            lossFractionPerWeek: 0.013,
            slopeSigmaFractionPerWeek: 0.005,
          ),
        ),
        0,
      );
    },
  );

  test('the limit is lower for lean users', () {
    final trend = trendOf(start: start, lossFractionPerWeek: 0.009);
    expect(
      raise(trend: trend, bodyFat: bodyFat25),
      0,
      reason: 'limit 1.0%',
    );
    expect(
      raise(trend: trend, bodyFat: bodyFat11),
      greaterThan(0),
      reason: 'limit 0.5% at 11% body fat',
    );
  });

  test('gaining or holding weight never raises anything', () {
    expect(raise(trend: trendOf(start: start, lossFractionPerWeek: 0)), 0);
    expect(raise(trend: trendOf(start: start, lossFractionPerWeek: -0.005)), 0);
  });

  test('no trend, no raise', () {
    expect(raise(trend: const []), 0);
  });
}
