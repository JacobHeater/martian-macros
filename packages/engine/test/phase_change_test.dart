import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/coach_loop.dart';
import 'support/synthetic_user.dart';

/// What happens to the trend, the expenditure estimate and the targets when
/// intake changes level and glycogen, water and gut contents move the scale
/// by a kilogram or two that is not tissue.
void main() {
  final profile = Profile(
    sex: BiologicalSex.male,
    birthDate: CalendarDate(1994, 3, 1),
    heightCm: 180,
  );
  final day0 = CalendarDate(2026, 1, 1);

  // Mifflin-St Jeor x 1.45 is about 2,640 kcal for this person, so the
  // starting estimate is right and any error comes from the weight data.
  SyntheticUser user(int seed, {double glycogen = 0.02}) => SyntheticUser(
    seed: seed,
    baseTdeeKcal: 2640,
    startWeightKg: 85,
    bodyFatPercent: 22,
    skipLogProbability: 0.03,
    glycogenSwingFraction: glycogen,
  );

  double mean(Iterable<double> values) =>
      values.reduce((a, b) => a + b) / values.length;

  TargetsRecord record(CalendarDate from, double kcal, {double tdee = 2600}) =>
      TargetsRecord(
        effectiveFrom: from,
        mode: GoalMode.fatLoss,
        tdeeKcal: tdee,
        tdeeSigmaKcal: 300,
        tdeeStatus: TdeeStatus.held,
        targets: DailyTargets(
          kcal: kcal,
          proteinG: 160,
          fatG: 70,
          carbsG: 200,
          weeklyRateFraction: -0.0075,
          flags: const {},
        ),
      );

  group('the simulated glycogen store', () {
    test('adds 1 to 2 kg to the first ten days of a deficit, and gives it '
        'back at maintenance', () {
      final person = user(1);
      for (var d = 0; d < 10; d++) {
        person.liveDay(2100);
      }
      expect(person.glycogenOffsetKg, inInclusiveRange(-2.0, -1.0));
      for (var d = 0; d < 14; d++) {
        person.liveDay(person.trueTdeeKcal);
      }
      expect(person.glycogenOffsetKg.abs(), lessThan(0.4));
    });

    test('is off unless asked for, so existing seeds are unchanged', () {
      final person = SyntheticUser(seed: 1);
      for (var d = 0; d < 10; d++) {
        person.liveDay(2000);
      }
      expect(person.glycogenOffsetKg, 0);
    });
  });

  group('settling windows', () {
    test('a first target well below expenditure opens one', () {
      final windows = settlingWindows([record(day0, 2000)]);
      expect(windows.single.start, day0);
      expect(windows.single.end, day0.addDays(settlingDays - 1));
    });

    test('a first target at maintenance does not', () {
      expect(settlingWindows([record(day0, 2550)]), isEmpty);
    });

    test('a weekly step does not, and leaving a deficit does', () {
      final windows = settlingWindows([
        record(day0, 2000),
        record(day0.addDays(28), 1920),
        record(day0.addDays(84), 2500),
      ]);
      expect([for (final w in windows) w.start], [day0, day0.addDays(84)]);
    });
  });

  group('the estimator', () {
    const estimator = TdeeEstimator();
    const prior = TdeePrior(kcal: 2640, sigmaKcal: 396);

    TdeeEstimate estimateOn(int day, {required bool settle}) {
      final person = user(7);
      final intake = <IntakeDay>[];
      final weights = <WeightObservation>[];
      for (var d = 0; d < day; d++) {
        final lived = person.liveDay(2000);
        if (lived.intake != null) intake.add(lived.intake!);
        if (lived.weight != null) weights.add(lived.weight!);
      }
      final asOf = person.today.addDays(-1);
      final settling = settle
          ? settlingWindows([record(day0, 2000, tdee: 2640)])
          : const <SettlingWindow>[];
      return estimator.estimate(
        asOf: asOf,
        intake: intake,
        trend: const WeightTrendModel().smooth(
          weights,
          through: asOf,
          shift: settlingShift(settling, 85),
        ),
        prior: prior,
        bmrKcal: 1820,
        energyDensityForSlope: (slope) => energyDensityForSlope(
          slopeKgPerDay: slope,
          fatMassKg: person.fatMassKg,
          resistanceTrained: true,
        ),
        settling: settling,
      );
    }

    test('holds, and says until when, while too few days are left outside '
        'the window', () {
      final estimate = estimateOn(20, settle: true);
      expect(estimate.status, TdeeStatus.held);
      expect(estimate.kcal, prior.kcal);
      expect(estimate.settlingUntil, day0.addDays(settlingDays - 1));
    });

    test('measures once fourteen days lie outside it, using only those '
        'days', () {
      final estimate = estimateOn(28, settle: true);
      expect(estimate.status, TdeeStatus.updated);
      expect(estimate.usableIntakeDays, lessThanOrEqualTo(18));
      expect(estimate.settlingUntil, isNull);
    });

    test('without a window, behaves as before', () {
      expect(estimateOn(20, settle: false).status, TdeeStatus.updated);
    });
  });

  group('starting a deficit', () {
    ({double firstError, double coverage, double firstWeek}) run({
      required double glycogen,
      required bool settle,
    }) {
      final firstErrors = <double>[];
      final firstWeeks = <double>[];
      var covered = 0;
      var total = 0;
      for (var seed = 100; seed < 140; seed++) {
        final weeks = runCoachLoop(
          user: user(seed, glycogen: glycogen),
          profile: profile,
          mode: GoalMode.fatLoss,
          weeks: 10,
          settle: settle,
        );
        final measured = [
          for (final w in weeks)
            if (w.tdee.status == TdeeStatus.updated) w,
        ];
        for (final w in measured) {
          total++;
          if ((w.tdee.kcal - w.trueTdeeKcal).abs() <= 2 * w.tdee.sigmaKcal) {
            covered++;
          }
        }
        firstErrors.add(measured.first.tdee.kcal - measured.first.trueTdeeKcal);
        firstWeeks.add(measured.first.week.toDouble());
      }
      return (
        firstError: mean(firstErrors),
        coverage: covered / total,
        firstWeek: mean(firstWeeks),
      );
    }

    test('the defect: without settling, the first measurement is far too '
        'high and its uncertainty is not honest', () {
      final broken = run(glycogen: 0.02, settle: false);
      // Was 250 before the starting prior used daily activity (MM-164); the
      // simulated users start from a lower prior, so the error is 236. It is
      // still about twice the bound the fixed version must meet (125).
      expect(broken.firstError, greaterThan(200));
      expect(broken.coverage, lessThan(0.85));
    });

    test('with settling, the first measurement is close and the '
        'uncertainty is honest', () {
      final fixed = run(glycogen: 0.02, settle: true);
      final noGlycogen = run(glycogen: 0, settle: true);
      expect(fixed.firstError.abs(), lessThan(125));
      // What the glycogen shift itself still contributes.
      expect(fixed.firstError - noGlycogen.firstError, lessThan(100));
      expect(fixed.coverage, greaterThanOrEqualTo(0.85));
      expect(noGlycogen.coverage, greaterThanOrEqualTo(0.85));
      // The price: the first measurement waits for 14 days outside the
      // window, so it arrives at the day-28 check-in.
      expect(fixed.firstWeek, 4);
    });
  });

  group('ending a deficit', () {
    /// Mean of (target - true expenditure) over forty users, per week.
    Map<int, double> targetError({
      required double glycogen,
      required bool settle,
    }) {
      final byWeek = <int, List<double>>{};
      for (var seed = 200; seed < 240; seed++) {
        final weeks = runCoachLoop(
          user: user(seed, glycogen: glycogen),
          profile: profile,
          mode: GoalMode.fatLoss,
          weeks: 17,
          settle: settle,
          modeAt: (w) => w < 12 ? GoalMode.fatLoss : GoalMode.maintenance,
        );
        for (var w = 12; w <= 16; w++) {
          byWeek
              .putIfAbsent(w, () => [])
              .add(weeks[w].targets.kcal - weeks[w].trueTdeeKcal);
        }
      }
      return byWeek.map((week, errors) => MapEntry(week, mean(errors)));
    }

    double worst(Map<int, double> errors) =>
        errors.values.map((e) => e.abs()).reduce((a, b) => a > b ? a : b);

    test('maintenance targets stay near true expenditure for the four '
        'weeks after', () {
      expect(worst(targetError(glycogen: 0.02, settle: true)), lessThan(100));
    });

    test('the defect: without settling, and with no glycogen rebound to '
        'mask it, the trend goes on losing and targets climb', () {
      final broken = targetError(glycogen: 0, settle: false);
      expect(broken[16], greaterThan(250));
      expect(worst(targetError(glycogen: 0, settle: true)), lessThan(175));
    });
  });
}
