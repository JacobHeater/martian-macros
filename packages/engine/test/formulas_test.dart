import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  group('energy expenditure', () {
    test('Mifflin-St Jeor matches hand calculation for both sexes', () {
      // 10*80 + 6.25*180 - 5*30 = 1775
      expect(
        mifflinStJeorKcal(
          sex: BiologicalSex.male,
          weightKg: 80,
          heightCm: 180,
          ageYears: 30,
        ),
        1780,
      );
      expect(
        mifflinStJeorKcal(
          sex: BiologicalSex.female,
          weightKg: 80,
          heightCm: 180,
          ageYears: 30,
        ),
        1614,
      );
    });

    test('Katch-McArdle', () {
      expect(katchMcArdleKcal(fatFreeMassKg: 60), closeTo(1666, 1e-9));
    });

    test('initial prior uses a conservative activity factor', () {
      final prior = initialTdeePrior(bmrKcal: 1800, trainingDaysPerWeek: 3);
      expect(prior.kcal, closeTo(2610, 1e-9));
      expect(prior.sigmaKcal, closeTo(391.5, 1e-9));
    });
  });

  group('partition', () {
    test('Forbes lean fraction falls as fat mass rises', () {
      final lean = leanFractionOfChange(
        fatMassKg: 10,
        losing: true,
        resistanceTrained: false,
      );
      final fat = leanFractionOfChange(
        fatMassKg: 40,
        losing: true,
        resistanceTrained: false,
      );
      expect(lean, closeTo(10.4 / 20.4, 1e-9));
      expect(fat, lessThan(lean));
    });

    test('training halves lean loss in a deficit but not in a surplus', () {
      double p({required bool losing}) => leanFractionOfChange(
        fatMassKg: 20,
        losing: losing,
        resistanceTrained: true,
      );
      expect(p(losing: true), closeTo(0.5 * 10.4 / 30.4, 1e-9));
      expect(p(losing: false), closeTo(10.4 / 30.4, 1e-9));
    });

    test('energy density spans lean-only to fat-only', () {
      expect(energyDensityKcalPerKg(0), fatMassKcalPerKg);
      expect(energyDensityKcalPerKg(1), fatFreeMassKcalPerKg);
    });
  });

  group('body composition', () {
    test('Deurenberg estimate is sex-specific', () {
      double bf(BiologicalSex sex) => deurenbergBodyFat(
        sex: sex,
        weightKg: 80,
        heightCm: 180,
        ageYears: 30,
      ).percent;
      expect(
        bf(BiologicalSex.female) - bf(BiologicalSex.male),
        closeTo(10.8, 1e-9),
      );
    });

    test('fat-free mass upper bound uses the lower body-fat bound', () {
      const estimate = BodyFatEstimate(percent: 20, sigmaPercent: 2);
      expect(estimate.lowerPercent, 16);
      expect(estimate.fatFreeMassUpperKg(100), closeTo(84, 1e-9));
    });
  });

  group('cycle noise', () {
    test('widens noise around each menses start only', () {
      final start = CalendarDate(2026, 3, 10);
      final noise = cycleNoiseMultiplier([
        for (var i = 0; i < 5; i++) MenstruationDay(start.addDays(i)),
      ]);
      expect(noise(start.addDays(-6)), 1.0);
      expect(noise(start.addDays(-5)), 1.6);
      expect(noise(start.addDays(2)), 1.6);
      expect(noise(start.addDays(3)), 1.0);
    });

    test('is neutral without data', () {
      expect(cycleNoiseMultiplier(const [])(CalendarDate(2026, 1, 1)), 1.0);
    });
  });

  group('mode advisor', () {
    final policy = CoachingPolicy.derive(
      profile: Profile(
        sex: BiologicalSex.male,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 180,
      ),
      screening: const ScreeningAnswers(),
      today: CalendarDate(2026, 10, 5),
    );

    GoalMode mode(double bf, TrainingStatus status) => recommendMode(
      sex: BiologicalSex.male,
      bodyFatPercent: bf,
      trainingStatus: status,
      policy: policy,
    ).mode;

    test('recommends recomp for novices and returning lifters', () {
      expect(mode(18, TrainingStatus.novice), GoalMode.recomp);
      expect(mode(18, TrainingStatus.returning), GoalMode.recomp);
    });

    test('recommends a cut at very high body fat, even for novices', () {
      expect(mode(28, TrainingStatus.novice), GoalMode.fatLoss);
    });

    test('lean trained lifters gain; moderate trained lifters cut', () {
      expect(mode(12, TrainingStatus.intermediate), GoalMode.leanGain);
      expect(mode(17, TrainingStatus.intermediate), GoalMode.fatLoss);
    });

    test('uses female thresholds for female users', () {
      final femalePolicy = CoachingPolicy.derive(
        profile: Profile(
          sex: BiologicalSex.female,
          birthDate: CalendarDate(1990, 1, 1),
          heightCm: 165,
        ),
        screening: const ScreeningAnswers(),
        today: CalendarDate(2026, 10, 5),
      );
      ModeRecommendation rec(double bf) => recommendMode(
        sex: BiologicalSex.female,
        bodyFatPercent: bf,
        trainingStatus: TrainingStatus.intermediate,
        policy: femalePolicy,
      );
      expect(rec(22).mode, GoalMode.leanGain);
      expect(rec(31).mode, GoalMode.recomp);
    });
  });
}
