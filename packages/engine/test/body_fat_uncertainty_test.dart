import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-132: body-fat thresholds applied to a number nobody knows.
void main() {
  final start = CalendarDate(2026, 1, 1);

  CoachingPolicy policy() => CoachingPolicy.derive(
    profile: Profile(
      sex: BiologicalSex.male,
      birthDate: CalendarDate(1990, 1, 1),
      heightCm: 180,
    ),
    screening: const ScreeningAnswers(),
    today: start,
  );

  /// A man on fat loss asking for the fastest pace, so the limit decides.
  DailyTargets targetsFor(BodyFatEstimate estimate, {double? safety}) =>
      computeTargets(
        TargetInputs(
          sex: BiologicalSex.male,
          heightCm: 180,
          trendWeightKg: 90,
          bodyFat: estimate,
          mode: GoalMode.fatLoss,
          trainingStatus: TrainingStatus.intermediate,
          policy: policy(),
          tdeeKcal: 3000,
          bmrKcal: 1900,
          requestedLossFraction: 0.01,
          safetyBodyFatPercent: safety,
        ),
      );

  BodyFatEstimate formula(double percent) =>
      BodyFatEstimate(percent: percent, sigmaPercent: 5);

  test('plausibly lean: a formula estimate of 18% gets the lean limits', () {
    final t = targetsFor(formula(18));
    expect(t.weeklyRateFraction, closeTo(-0.007, 1e-12));
    // At least what the lean rule gives at 15%.
    final atFifteen = SafetyBounds.proteinRangeG(
      sex: BiologicalSex.male,
      weightKg: 90,
      heightCm: 180,
      bodyFatPercent: 15,
      inDeficit: true,
    );
    expect(t.proteinG, greaterThanOrEqualTo(atFifteen.midG));
    // The energy-availability floor applies: 30 kcal per kg of fat-free mass.
    final floor = SafetyBounds.calorieFloorKcal(
      sex: BiologicalSex.male,
      bmrKcal: 1900,
      bodyFatPercent: cautiousBodyFatPercent(formula(18)),
      fatFreeMassUpperKg: formula(18).fatFreeMassUpperKg(90),
      trainingKcalPerDay: 0,
    );
    expect(floor, greaterThan(1900));
    expect(t.kcal, greaterThanOrEqualTo(floor - 1e-9));
  });

  test('clearly not lean: 26% gets the ordinary limit', () {
    expect(targetsFor(formula(26)).weeklyRateFraction, closeTo(-0.01, 1e-12));
  });

  test('a better measurement relaxes it', () {
    final measured = const BodyFatEstimate(percent: 18, sigmaPercent: 2);
    expect(targetsFor(measured).weeklyRateFraction, closeTo(-0.01, 1e-12));
  });

  test('the threshold is a quarter chance of being on the strict side', () {
    // At 15% the strict side applies up to about 18.4% with a 5-point sigma.
    expect(cautiousBodyFatPercent(formula(18.3)), lessThan(15));
    expect(cautiousBodyFatPercent(formula(18.5)), greaterThan(15));
  });

  test('no flipping: an estimate moving 18.0, 18.6, 18.2, 18.9 gives the '
      'same limit each time', () {
    double? previous;
    final rates = <double>[];
    for (final percent in [18.0, 18.6, 18.2, 18.9]) {
      final safety = safetyBodyFatPercent(formula(percent), previous: previous);
      previous = safety;
      rates.add(
        targetsFor(formula(percent), safety: safety).weeklyRateFraction,
      );
    }
    expect(rates.toSet(), hasLength(1));
    expect(rates.first, closeTo(-0.007, 1e-12));
  });

  test('without memory the same sequence would flip', () {
    // The reason the hold exists.
    final rates = {
      for (final p in [18.0, 18.6, 18.2, 18.9])
        targetsFor(formula(p)).weeklyRateFraction,
    };
    expect(rates, hasLength(2));
  });

  test('a real change of more than two points does move it', () {
    final held = safetyBodyFatPercent(formula(18), previous: 14.6);
    expect(held, 14.6);
    final moved = safetyBodyFatPercent(formula(22), previous: 14.6);
    expect(moved, closeTo(22 - 0.6745 * 5, 1e-9));
  });

  test('the fastest pace needs the user to be clearly above its line', () {
    expect(bodyFatClearlyAbove(formula(27), 25), isFalse);
    expect(bodyFatClearlyAbove(formula(29), 25), isTrue);
    expect(
      bodyFatClearlyAbove(
        const BodyFatEstimate(percent: 27, sigmaPercent: 2),
        25,
      ),
      isTrue,
      reason: 'a better measurement is enough',
    );
  });

  group('a correction in Settings', () {
    UserSetup setup() => UserSetup(
      profile: Profile(
        sex: BiologicalSex.male,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 180,
      ),
      screening: const ScreeningAnswers(),
      trainingStatus: TrainingStatus.intermediate,
      trainingDaysPerWeek: 3,
      goalMode: GoalMode.fatLoss,
      onboardedOn: start.addDays(-30),
    );

    TargetsRecord lastRecord(double safety) => TargetsRecord(
      effectiveFrom: start.addDays(28),
      mode: GoalMode.fatLoss,
      tdeeKcal: 2900,
      tdeeSigmaKcal: 250,
      tdeeStatus: TdeeStatus.updated,
      safetyBodyFatPercent: safety,
      targets: const DailyTargets(
        kcal: 2400,
        proteinG: 180,
        fatG: 70,
        carbsG: 280,
        weeklyRateFraction: -0.0075,
      ),
    );

    CoachSnapshot snapshotWith(BodyFatEstimate estimate) {
      final weights = [
        for (var d = 0; d < 30; d++)
          WeightObservation(date: start.addDays(d), weightKg: 90),
      ];
      final base = analyze(
        setup: setup(),
        weights: weights,
        intake: const [],
        today: start.addDays(30),
      )!;
      return CoachSnapshot(
        policy: base.policy,
        trend: base.trend,
        trendWeightKg: base.trendWeightKg,
        bodyFat: estimate,
        bmrKcal: base.bmrKcal,
        tdee: base.tdee,
        recommendation: base.recommendation,
      );
    }

    test('toward leaner applies at once, before the check-in is due', () {
      // Two days after the last targets; safety was 24 (a fatter estimate).
      final next = nextTargets(
        setup: setup(),
        snapshot: snapshotWith(
          const BodyFatEstimate(percent: 15, sigmaPercent: 4),
        ),
        history: [lastRecord(24)],
        today: start.addDays(30),
      );
      expect(next, isNotNull);
      expect(next!.safetyBodyFatPercent, closeTo(15 - 0.6745 * 4, 1e-9));
      expect(next.targets.weeklyRateFraction, closeTo(-0.007, 1e-12));
    });

    test('toward fatter waits for the check-in', () {
      final next = nextTargets(
        setup: setup(),
        snapshot: snapshotWith(
          const BodyFatEstimate(percent: 30, sigmaPercent: 4),
        ),
        history: [lastRecord(12)],
        today: start.addDays(30),
      );
      expect(next, isNull);
    });

    test('a small change does nothing', () {
      final next = nextTargets(
        setup: setup(),
        snapshot: snapshotWith(
          const BodyFatEstimate(percent: 21, sigmaPercent: 4),
        ),
        history: [lastRecord(18.5)],
        today: start.addDays(30),
      );
      expect(next, isNull);
    });
  });

  test('the check-in stores the figure it used', () {
    final weights = [
      for (var d = 0; d < 3; d++)
        WeightObservation(date: start.addDays(d), weightKg: 90),
    ];
    final s = UserSetup(
      profile: Profile(
        sex: BiologicalSex.male,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 180,
      ),
      screening: const ScreeningAnswers(),
      trainingStatus: TrainingStatus.intermediate,
      trainingDaysPerWeek: 3,
      goalMode: GoalMode.fatLoss,
      onboardedOn: start,
    );
    final snapshot = analyze(
      setup: s,
      weights: weights,
      intake: const [],
      today: start.addDays(3),
    )!;
    final first = nextTargets(
      setup: s,
      snapshot: snapshot,
      history: const [],
      today: start.addDays(3),
    )!;
    expect(
      first.safetyBodyFatPercent,
      closeTo(cautiousBodyFatPercent(snapshot.bodyFat), 1e-9),
    );
  });

  test('a measured body fat has a 4-point uncertainty, a formula one 5', () {
    final weights = [WeightObservation(date: start, weightKg: 90)];
    UserSetup withBodyFat(double? bf) => UserSetup(
      profile: Profile(
        sex: BiologicalSex.male,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 180,
      ),
      screening: const ScreeningAnswers(),
      trainingStatus: TrainingStatus.intermediate,
      trainingDaysPerWeek: 3,
      goalMode: GoalMode.fatLoss,
      onboardedOn: start,
      bodyFatPercent: bf,
    );
    CoachSnapshot snap(double? bf) => analyze(
      setup: withBodyFat(bf),
      weights: weights,
      intake: const [],
      today: start,
    )!;
    expect(snap(null).bodyFat.sigmaPercent, 5);
    expect(snap(20).bodyFat.sigmaPercent, 4);
  });
}
