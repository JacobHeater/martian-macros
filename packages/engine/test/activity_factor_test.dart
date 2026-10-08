import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-164: the starting expenditure estimate depends on daily activity as
/// well as training days.
void main() {
  const daily = {
    DailyActivity.seated: 1.20,
    DailyActivity.light: 1.30,
    DailyActivity.onFeet: 1.40,
    DailyActivity.physicalJob: 1.50,
  };

  group('activityFactor', () {
    for (final level in DailyActivity.values) {
      for (var days = 0; days <= 7; days++) {
        test('${level.name} with $days training days', () {
          expect(
            activityFactor(dailyActivity: level, trainingDaysPerWeek: days),
            closeTo(daily[level]! + 0.025 * days, 1e-12),
          );
        });
      }
    }

    test('every activity level is covered by the table above', () {
      expect(daily.keys.toSet(), DailyActivity.values.toSet());
    });

    test('more activity or more training never lowers the factor', () {
      for (var days = 0; days <= 7; days++) {
        double? previous;
        for (final level in DailyActivity.values) {
          final f = activityFactor(
            dailyActivity: level,
            trainingDaysPerWeek: days,
          );
          if (previous != null) expect(f, greaterThan(previous));
          previous = f;
        }
      }
    });

    test('training days outside 0 to 7 are held to that range', () {
      double f(int days) => activityFactor(
        dailyActivity: DailyActivity.light,
        trainingDaysPerWeek: days,
      );
      expect(f(-2), f(0));
      expect(f(12), f(7));
    });

    test('stays at or just under the common published multipliers', () {
      double f(DailyActivity a, int d) =>
          activityFactor(dailyActivity: a, trainingDaysPerWeek: d);
      expect(f(DailyActivity.seated, 3), inInclusiveRange(1.2, 1.375));
      expect(f(DailyActivity.light, 3), closeTo(1.375, 1e-12));
      expect(f(DailyActivity.onFeet, 4), inInclusiveRange(1.375, 1.55));
      expect(f(DailyActivity.physicalJob, 6), inInclusiveRange(1.55, 1.725));
    });
  });

  group('initialTdeePrior', () {
    test('is resting energy times the factor, with 15% uncertainty', () {
      final prior = initialTdeePrior(
        bmrKcal: 1800,
        dailyActivity: DailyActivity.light,
        trainingDaysPerWeek: 3,
      );
      expect(prior.kcal, closeTo(1800 * 1.375, 1e-9));
      expect(prior.sigmaKcal, closeTo(1800 * 1.375 * 0.15, 1e-9));
    });

    test('two otherwise identical people differ by their daily activity', () {
      double kcal(DailyActivity a) => initialTdeePrior(
        bmrKcal: 1800,
        dailyActivity: a,
        trainingDaysPerWeek: 3,
      ).kcal;
      // 1.575 / 1.275: the physical job is about 24% higher.
      expect(
        kcal(DailyActivity.physicalJob) / kcal(DailyActivity.seated),
        closeTo(1.575 / 1.275, 1e-9),
      );
    });
  });
}
