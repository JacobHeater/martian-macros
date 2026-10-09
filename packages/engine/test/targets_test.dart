import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);

  CoachingPolicy policyFor(
    BiologicalSex sex, [
    ScreeningAnswers screening = const ScreeningAnswers(),
  ]) => CoachingPolicy.derive(
    profile: Profile(
      sex: sex,
      birthDate: CalendarDate(1990, 1, 1),
      heightCm: 178,
    ),
    screening: screening,
    today: today,
  );

  TargetInputs inputs({
    BiologicalSex sex = BiologicalSex.male,
    GoalMode mode = GoalMode.fatLoss,
    double weightKg = 90,
    double heightCm = 178,
    double bodyFat = 25,
    double tdee = 2800,
    double bmr = 1850,
    DailyTargets? previous,
    int deficitWeeks = 0,
    CoachingPolicy? policy,
    TrainingStatus status = TrainingStatus.intermediate,
    double? requestedLoss,
    double safetyRaise = 0,
    double? safetyBodyFat,
    int trainingDaysPerWeek = 3,
  }) => TargetInputs(
    sex: sex,
    heightCm: heightCm,
    trendWeightKg: weightKg,
    bodyFat: BodyFatEstimate(percent: bodyFat, sigmaPercent: 2),
    mode: mode,
    trainingStatus: status,
    trainingDaysPerWeek: trainingDaysPerWeek,
    policy: policy ?? policyFor(sex),
    tdeeKcal: tdee,
    bmrKcal: bmr,
    previous: previous,
    consecutiveDeficitWeeks: deficitWeeks,
    requestedLossFraction: requestedLoss,
    safetyBodyFatPercent: safetyBodyFat,
    safetyRaiseKcal: safetyRaise,
  );

  group('SafetyBounds', () {
    test('absolute floors differ by sex', () {
      expect(SafetyBounds.absoluteFloorKcal(BiologicalSex.male), 1500);
      expect(SafetyBounds.absoluteFloorKcal(BiologicalSex.female), 1200);
    });

    test('energy availability dominates the floor for lean users only', () {
      double floor(double bodyFat) => SafetyBounds.calorieFloorKcal(
        sex: BiologicalSex.male,
        bmrKcal: 1700,
        bodyFatPercent: bodyFat,
        fatFreeMassUpperKg: 65,
        trainingKcalPerDay: 300,
      );
      expect(floor(12), 30 * 65 + 300);
      expect(floor(25), 1700);
    });

    test('maximum loss rate tapers as users get leaner', () {
      expect(SafetyBounds.maxWeeklyLossFraction(BiologicalSex.male, 25), 0.01);
      expect(SafetyBounds.maxWeeklyLossFraction(BiologicalSex.male, 13), 0.007);
      expect(SafetyBounds.maxWeeklyLossFraction(BiologicalSex.male, 10), 0.005);
      expect(
        SafetyBounds.maxWeeklyLossFraction(BiologicalSex.female, 24),
        0.007,
      );
    });

    test('goal body fat floors are sex-specific', () {
      expect(
        SafetyBounds.checkGoalBodyFat(BiologicalSex.male, 9),
        GoalBodyFatCheck.warnAndTimeLimit,
      );
      expect(
        SafetyBounds.checkGoalBodyFat(BiologicalSex.male, 7),
        GoalBodyFatCheck.rejected,
      );
      expect(
        SafetyBounds.checkGoalBodyFat(BiologicalSex.female, 12),
        GoalBodyFatCheck.rejected,
      );
      expect(
        SafetyBounds.checkGoalBodyFat(BiologicalSex.female, 20),
        GoalBodyFatCheck.accepted,
      );
    });

    test('protein uses fat-free mass when lean and dieting', () {
      final range = SafetyBounds.proteinRangeG(
        sex: BiologicalSex.male,
        weightKg: 80,
        heightCm: 180,
        bodyFatPercent: 12,
        inDeficit: true,
      );
      expect(range.minG, closeTo(2.3 * 70.4, 1e-9));
      expect(range.maxG, closeTo(3.1 * 70.4, 1e-9));
    });

    double proteinTarget(
      double weightKg, {
      double heightCm = 180,
      BiologicalSex sex = BiologicalSex.male,
    }) => SafetyBounds.proteinRangeG(
      sex: sex,
      weightKg: weightKg,
      heightCm: heightCm,
      bodyFatPercent: 35,
      inDeficit: true,
    ).midG;

    test('reference weight is body weight up to BMI 25, then a quarter of '
        'the excess', () {
      double reference(double kg) =>
          SafetyBounds.referenceWeightKg(weightKg: kg, heightCm: 180);
      expect(reference(70), 70);
      expect(reference(81), closeTo(81, 1e-9));
      expect(reference(121), closeTo(91, 1e-9));
    });

    test('protein is unchanged at a healthy weight', () {
      final range = SafetyBounds.proteinRangeG(
        sex: BiologicalSex.male,
        weightKg: 77.8, // BMI 24 at 180 cm
        heightCm: 180,
        bodyFatPercent: 20,
        inDeficit: false,
      );
      expect(range.minG, closeTo(1.6 * 77.8, 1e-9));
      expect(range.maxG, closeTo(2.2 * 77.8, 1e-9));
    });

    test('goal and training choose the protein minimum and target', () {
      final cut = computeTargets(
        inputs(weightKg: 80, heightCm: 180, bodyFat: 20),
      );
      expect(cut.proteinMinimumG, closeTo(128, 1e-9));
      expect(cut.proteinG, closeTo(160, 1e-9));

      final maintenance = computeTargets(
        inputs(
          weightKg: 80,
          heightCm: 180,
          bodyFat: 20,
          mode: GoalMode.maintenance,
        ),
      );
      expect(maintenance.proteinG, closeTo(144, 1e-9));

      final leanGain = computeTargets(
        inputs(
          weightKg: 80,
          heightCm: 180,
          bodyFat: 20,
          mode: GoalMode.leanGain,
        ),
      );
      expect(leanGain.proteinMinimumG, closeTo(128, 1e-9));
      expect(leanGain.proteinG, closeTo(144, 1e-9));

      final notLifting = computeTargets(
        inputs(
          weightKg: 80,
          heightCm: 180,
          bodyFat: 20,
          status: TrainingStatus.untrained,
          trainingDaysPerWeek: 0,
        ),
      );
      expect(notLifting.proteinMinimumG, closeTo(96, 1e-9));
      expect(notLifting.proteinG, closeTo(128, 1e-9));
    });

    test('the senior protein floor reaches targets unless kidney-capped', () {
      final policy = CoachingPolicy.derive(
        profile: Profile(
          sex: BiologicalSex.male,
          birthDate: CalendarDate(1959, 1, 1),
          heightCm: 180,
        ),
        screening: const ScreeningAnswers(),
        today: today,
        weightKg: 80,
      );
      final targets = computeTargets(
        inputs(
          weightKg: 80,
          heightCm: 180,
          bodyFat: 20,
          mode: GoalMode.maintenance,
          status: TrainingStatus.untrained,
          trainingDaysPerWeek: 0,
          policy: policy,
        ),
      );
      expect(targets.proteinMinimumG, closeTo(96, 1e-9));
      expect(targets.proteinG, closeTo(128, 1e-9));
    });

    test(
      'protein minimum defines meeting the target without an upper limit',
      () {
        final targets = computeTargets(
          inputs(weightKg: 80, heightCm: 180, bodyFat: 20),
        );
        expect(targets.meetsProteinMinimum(127), isFalse);
        expect(targets.meetsProteinMinimum(135), isTrue);
        expect(targets.meetsProteinMinimum(230), isTrue);
        expect(targets.flags, isEmpty);
      },
    );

    test('kidney cap overrides the age floor and sets both values', () {
      final policy = CoachingPolicy.derive(
        profile: Profile(
          sex: BiologicalSex.male,
          birthDate: CalendarDate(1959, 1, 1),
          heightCm: 180,
        ),
        screening: const ScreeningAnswers(chronicKidneyDisease: true),
        today: today,
        weightKg: 80,
      );
      final targets = computeTargets(
        inputs(
          weightKg: 80,
          heightCm: 180,
          bodyFat: 20,
          mode: GoalMode.maintenance,
          policy: policy,
        ),
      );
      expect(targets.proteinMinimumG, 64);
      expect(targets.proteinG, 64);
      expect(targets.flags, contains(TargetFlag.proteinCapped));
    });

    test('lean deficit interpolation avoids a target cliff', () {
      var previous = 0.0;
      for (var bodyFat = 19.0; bodyFat >= 14; bodyFat -= 1) {
        final weight = 80 - (19 - bodyFat) * 0.5;
        final targets = computeTargets(
          inputs(weightKg: weight, bodyFat: bodyFat, safetyBodyFat: bodyFat),
        );
        if (previous > 0) {
          expect((targets.proteinG - previous).abs(), lessThanOrEqualTo(10));
        }
        previous = targets.proteinG;
      }
    });

    test('lean deficit interpolation uses the specified target points', () {
      const expectedTargets = [160.0, 164.2133333333, 169.8133333333, 176.8];
      for (var index = 0; index < 4; index++) {
        final bodyFat = 18.0 - index;
        final targets = computeTargets(
          inputs(
            weightKg: 80,
            heightCm: 180,
            bodyFat: bodyFat,
            safetyBodyFat: bodyFat,
          ),
        );
        expect(targets.proteinG, closeTo(expectedTargets[index], 1e-8));
      }
    });

    test('protein does not step at BMI 30', () {
      expect((proteinTarget(97.3) - proteinTarget(96.9)).abs(), lessThan(2));
    });

    test('protein is continuous and never falls as weight rises', () {
      for (final sex in BiologicalSex.values) {
        for (var heightCm = 150.0; heightCm <= 200; heightCm += 10) {
          final heightM = heightCm / 100;
          var previous = 0.0;
          for (
            var kg = 18 * heightM * heightM;
            kg <= 50 * heightM * heightM;
            kg += 0.5
          ) {
            final target = proteinTarget(kg, heightCm: heightCm, sex: sex);
            if (previous > 0) {
              expect(target, greaterThanOrEqualTo(previous));
              expect(target - previous, lessThan(2));
            }
            previous = target;
          }
        }
      }
    });

    test('protein stays sensible at a high weight', () {
      expect(proteinTarget(140), inInclusiveRange(150, 200));
    });

    test('the fat minimum uses the same reference weight', () {
      final fat = SafetyBounds.minFatG(
        sex: BiologicalSex.male,
        weightKg: 121,
        heightCm: 180,
        kcal: 1500,
      );
      expect(fat, closeTo(0.5 * 91, 1e-9));
    });

    test('kidney-disease cap overrides protein', () {
      final range = SafetyBounds.proteinRangeG(
        sex: BiologicalSex.male,
        weightKg: 80,
        heightCm: 180,
        bodyFatPercent: 20,
        inDeficit: false,
        capGPerKg: 0.8,
      );
      expect(range.maxG, 64);
    });

    test('weekly change is the smaller of 100 kcal and 5%', () {
      expect(SafetyBounds.maxWeeklyTargetChange(2400), 100);
      expect(SafetyBounds.maxWeeklyTargetChange(1600), 80);
    });
  });

  group('computeTargets', () {
    test('fat loss sets a deficit and macros that add up', () {
      final t = computeTargets(inputs());
      expect(t.kcal, lessThan(2800));
      expect(t.weeklyRateFraction, -0.0075);
      expect(4 * t.proteinG + 4 * t.carbsG + 9 * t.fatG, closeTo(t.kcal, 1));
      expect(t.flags, isEmpty);
    });

    test('caps the requested loss pace at the safety maximum', () {
      // 14.5% with a 2-point deviation is clearly in the 12% to 15% band.
      final t = computeTargets(inputs(bodyFat: 14.5, requestedLoss: 0.01));
      expect(t.weeklyRateFraction, -0.007);
    });

    test('never emits a target below the floor', () {
      final t = computeTargets(
        inputs(
          sex: BiologicalSex.female,
          weightKg: 55,
          bodyFat: 30,
          tdee: 1250,
        ),
      );
      expect(t.kcal, greaterThanOrEqualTo(1200));
      expect(t.flags, contains(TargetFlag.flooredAtSafetyMinimum));
    });

    test('limits the weekly change', () {
      final first = computeTargets(inputs(tdee: 2800));
      final next = computeTargets(inputs(tdee: 2300, previous: first));
      expect(first.kcal - next.kcal, closeTo(100, 1e-9));
      expect(next.flags, contains(TargetFlag.rateLimited));
    });

    test('a safety raise is not step-limited, and is flagged', () {
      final first = computeTargets(inputs(tdee: 2800));
      final raised = computeTargets(
        inputs(tdee: 2800, previous: first, safetyRaise: 300),
      );
      expect(raised.kcal, closeTo(first.kcal + 300, 1e-9));
      expect(raised.flags, contains(TargetFlag.raisedForSafePace));
      expect(raised.flags, isNot(contains(TargetFlag.rateLimited)));
    });

    test('a safety raise never lowers a target the formula already raised', () {
      final first = computeTargets(inputs(tdee: 2400));
      final plain = computeTargets(inputs(tdee: 3300, previous: first));
      final raised = computeTargets(
        inputs(tdee: 3300, previous: first, safetyRaise: 50),
      );
      // The ordinary step (+100) is already above first + 50.
      expect(raised.kcal, closeTo(plain.kcal, 1e-9));
      expect(raised.flags, isNot(contains(TargetFlag.raisedForSafePace)));
    });

    test('reductions are still limited when no raise applies', () {
      final first = computeTargets(inputs(tdee: 2800));
      final next = computeTargets(inputs(tdee: 2000, previous: first));
      expect(first.kcal - next.kcal, closeTo(100, 1e-9));
    });

    test('the week after a safety raise does not lower the target', () {
      final first = computeTargets(inputs(tdee: 2800));
      final raised = computeTargets(
        inputs(tdee: 2800, previous: first, safetyRaise: 300),
      );
      // The formula now wants less than the raised target.
      final after = computeTargets(inputs(tdee: 2400, previous: raised));
      expect(after.kcal, raised.kcal);
      expect(after.flags, contains(TargetFlag.heldAfterSafetyRaise));
      // The hold lasts one check-in; the week after, the ordinary limit
      // applies again.
      final later = computeTargets(inputs(tdee: 2400, previous: after));
      expect(after.kcal - later.kcal, closeTo(100, 1e-9));
      expect(later.flags, isNot(contains(TargetFlag.heldAfterSafetyRaise)));
    });

    test('a diet break returns calories at once, not 100 at a time', () {
      final deficit = computeTargets(inputs());
      final onBreak = computeTargets(
        inputs(previous: deficit, deficitWeeks: 16),
      );
      expect(onBreak.flags, contains(TargetFlag.dietBreak));
      expect(onBreak.kcal, closeTo(2800, 1e-9));
      expect(onBreak.kcal - deficit.kcal, greaterThan(100));
    });

    test('forces a diet break after 16 deficit weeks', () {
      final t = computeTargets(inputs(deficitWeeks: 16));
      expect(t.weeklyRateFraction, 0);
      expect(t.kcal, closeTo(2800, 1e-9));
      expect(t.flags, contains(TargetFlag.dietBreak));
    });

    test('falls back to maintenance when the mode is not allowed', () {
      final t = computeTargets(
        inputs(
          sex: BiologicalSex.female,
          policy: policyFor(
            BiologicalSex.female,
            const ScreeningAnswers(breastfeeding: true),
          ),
        ),
      );
      expect(t.flags, contains(TargetFlag.modeNotAllowed));
      expect(t.weeklyRateFraction, 0);
      expect(t.kcal, closeTo(2800 + 400, 1e-9));
    });

    test('lean gain is faster for novices than intermediates', () {
      final novice = computeTargets(
        inputs(mode: GoalMode.leanGain, status: TrainingStatus.novice),
      );
      final intermediate = computeTargets(inputs(mode: GoalMode.leanGain));
      expect(novice.kcal, greaterThan(intermediate.kcal));
      expect(intermediate.kcal, greaterThan(2800));
    });

    test('recomp is a small deficit, larger at high body fat', () {
      final high = computeTargets(inputs(mode: GoalMode.recomp, bodyFat: 24));
      final low = computeTargets(inputs(mode: GoalMode.recomp, bodyFat: 16));
      expect(high.weeklyRateFraction, -0.0025);
      expect(low.weeklyRateFraction, -0.001);
      expect(2800 - high.kcal, lessThan(400));
    });
  });
}
