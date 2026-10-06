import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

void main() {
  group('BiologicalSex', () {
    test('round-trips persisted names', () {
      for (final sex in BiologicalSex.values) {
        expect(BiologicalSex.parse(sex.name), sex);
      }
    });

    test('rejects anything outside the binary instead of defaulting', () {
      for (final bad in ['', 'other', 'notSet', 'Male', 'unknown']) {
        expect(() => BiologicalSex.parse(bad), throwsFormatException);
      }
    });
  });

  group('CalendarDate', () {
    test('parses, prints, and does day arithmetic', () {
      final d = CalendarDate.parse('2024-02-28');
      expect(d.addDays(1).toString(), '2024-02-29');
      expect(d.addDays(2).toString(), '2024-03-01');
      expect(d.daysUntil(CalendarDate(2024, 3, 28)), 29);
    });

    test('rejects impossible dates', () {
      expect(() => CalendarDate(2023, 2, 29), throwsArgumentError);
      expect(() => CalendarDate.parse('2023-13-01'), throwsArgumentError);
    });

    test('ignores time of day and timezone flag', () {
      expect(
        CalendarDate.fromDateTime(DateTime(2026, 3, 8, 23, 59)),
        CalendarDate(2026, 3, 8),
      );
    });
  });

  group('Profile', () {
    final profile = Profile(
      sex: BiologicalSex.female,
      birthDate: CalendarDate(2008, 6, 15),
      heightCm: 165,
    );

    test('computes completed years of age', () {
      expect(profile.ageOn(CalendarDate(2026, 6, 14)), 17);
      expect(profile.ageOn(CalendarDate(2026, 6, 15)), 18);
    });

    test('rejects implausible height', () {
      expect(
        () => Profile(
          sex: BiologicalSex.male,
          birthDate: CalendarDate(1990, 1, 1),
          heightCm: 18,
        ),
        throwsArgumentError,
      );
    });
  });

  group('dailyRelativeSigma', () {
    test('combines entry errors in quadrature', () {
      final sigma = dailyRelativeSigma([
        (500.0, QuantitySource.weighed),
        (500.0, QuantitySource.palm),
      ]);
      // sqrt(25^2 + 125^2) / 1000
      expect(sigma, closeTo(0.1275, 1e-4));
    });

    test('is zero for an empty day', () {
      expect(dailyRelativeSigma(const []), 0);
    });
  });

  group('CoachingPolicy', () {
    Profile adult(BiologicalSex sex) =>
        Profile(sex: sex, birthDate: CalendarDate(1990, 1, 1), heightCm: 170);
    final today = CalendarDate(2026, 10, 5);

    test('blocks minors entirely', () {
      final policy = CoachingPolicy.derive(
        profile: Profile(
          sex: BiologicalSex.male,
          birthDate: CalendarDate(2010, 1, 1),
          heightCm: 170,
        ),
        screening: const ScreeningAnswers(),
        today: today,
      );
      expect(policy.blocked, isTrue);
      expect(policy.allowedModes, isEmpty);
    });

    test('allows every mode with no flags', () {
      final policy = CoachingPolicy.derive(
        profile: adult(BiologicalSex.male),
        screening: const ScreeningAnswers(),
        today: today,
      );
      expect(policy.allowedModes, GoalMode.values.toSet());
    });

    test('locks pregnancy and lactation to maintenance', () {
      for (final s in const [
        ScreeningAnswers(pregnant: true),
        ScreeningAnswers(breastfeeding: true),
      ]) {
        final policy = CoachingPolicy.derive(
          profile: adult(BiologicalSex.female),
          screening: s,
          today: today,
        );
        expect(policy.allowedModes, {GoalMode.maintenance});
      }
    });

    test('adds lactation energy and caps protein for kidney disease', () {
      final policy = CoachingPolicy.derive(
        profile: adult(BiologicalSex.female),
        screening: const ScreeningAnswers(
          breastfeeding: true,
          chronicKidneyDisease: true,
        ),
        today: today,
      );
      expect(policy.maintenanceOffsetKcal, 400);
      expect(policy.proteinCapGPerKg, 0.8);
    });

    test('removes deficit modes after an eating disorder', () {
      final policy = CoachingPolicy.derive(
        profile: adult(BiologicalSex.male),
        screening: const ScreeningAnswers(eatingDisorderHistory: true),
        today: today,
      );
      expect(policy.allowedModes, {GoalMode.maintenance, GoalMode.leanGain});
      expect(policy.suppressWeightRewards, isTrue);
    });

    test('rejects female-only answers on a male profile', () {
      expect(
        () => CoachingPolicy.derive(
          profile: adult(BiologicalSex.male),
          screening: const ScreeningAnswers(pregnant: true),
          today: today,
        ),
        throwsArgumentError,
      );
    });
  });
}
