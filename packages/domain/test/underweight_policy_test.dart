import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-111: never coach an underweight user into a deficit.
void main() {
  final today = CalendarDate(2026, 10, 5);

  CoachingPolicy policy({
    required BiologicalSex sex,
    required double heightCm,
    double? weightKg,
    ScreeningAnswers screening = const ScreeningAnswers(),
  }) => CoachingPolicy.derive(
    profile: Profile(
      sex: sex,
      birthDate: CalendarDate(1990, 1, 1),
      heightCm: heightCm,
    ),
    screening: screening,
    today: today,
    weightKg: weightKg,
  );

  test('body mass index is weight over height squared', () {
    expect(bodyMassIndex(weightKg: 50, heightCm: 170), closeTo(17.30, 0.01));
    expect(bodyMassIndex(weightKg: 63, heightCm: 180), closeTo(19.44, 0.01));
  });

  test('a 170 cm woman at 50 kg is offered maintenance and lean gain only', () {
    final p = policy(sex: BiologicalSex.female, heightCm: 170, weightKg: 50);
    expect(p.underweight, isTrue);
    expect(p.allowedModes, {GoalMode.maintenance, GoalMode.leanGain});
    expect(p.cautions, contains(Caution.underweight));
  });

  test('in the caution zone a deficit is allowed but only at 0.5% a week', () {
    // 180 cm and 63 kg is BMI 19.4.
    final p = policy(sex: BiologicalSex.male, heightCm: 180, weightKg: 63);
    expect(p.underweight, isFalse);
    expect(p.allowedModes, GoalMode.values.toSet());
    expect(p.maxWeeklyLossFraction, 0.005);
    expect(p.cautions, contains(Caution.lowBodyWeight));
    expect(p.cautions, isNot(contains(Caution.underweight)));
  });

  test('the thresholds are 18.5 and 20', () {
    // At 180 cm, BMI 18.5 is 59.94 kg and BMI 20 is 64.8 kg.
    CoachingPolicy at(double kg) =>
        policy(sex: BiologicalSex.male, heightCm: 180, weightKg: kg);
    expect(at(59.9).underweight, isTrue);
    expect(at(60.0).underweight, isFalse);
    expect(at(60.0).maxWeeklyLossFraction, 0.005);
    expect(at(64.7).maxWeeklyLossFraction, 0.005);
    expect(at(64.9).maxWeeklyLossFraction, isNull);
    expect(at(64.9).cautions, isEmpty);
  });

  test('at BMI 24 this rule changes nothing', () {
    final p = policy(sex: BiologicalSex.male, heightCm: 180, weightKg: 78);
    expect(p.underweight, isFalse);
    expect(p.maxWeeklyLossFraction, isNull);
    expect(p.allowedModes, GoalMode.values.toSet());
    expect(p.cautions, isEmpty);
  });

  test('with no weight given, nothing changes', () {
    final p = policy(sex: BiologicalSex.female, heightCm: 170);
    expect(p.underweight, isFalse);
    expect(p.allowedModes, GoalMode.values.toSet());
  });

  test('it combines with the other rules and never widens them', () {
    final ed = policy(
      sex: BiologicalSex.female,
      heightCm: 170,
      weightKg: 50,
      screening: const ScreeningAnswers(eatingDisorderHistory: true),
    );
    expect(ed.allowedModes, {GoalMode.maintenance, GoalMode.leanGain});
    final pregnant = policy(
      sex: BiologicalSex.female,
      heightCm: 170,
      weightKg: 50,
      screening: const ScreeningAnswers(pregnant: true),
    );
    expect(pregnant.allowedModes, {GoalMode.maintenance});
  });

  test('age and insulin treatment set policy limits and protein floor', () {
    final older = Profile(
      sex: BiologicalSex.male,
      birthDate: CalendarDate(1960, 1, 1),
      heightCm: 170,
    );
    final p = CoachingPolicy.derive(
      profile: older,
      screening: const ScreeningAnswers(insulinOrSulfonylurea: true),
      today: today,
      weightKg: 80,
    );
    expect(p.maxWeeklyLossFraction, 0.005);
    expect(p.minimumProteinGPerKgReferenceWeight, 1.2);
    expect(p.cautions, contains(Caution.insulinOrSulfonylurea));
  });

  test('age-based policy starts on the sixty-fifth birthday', () {
    final profile = Profile(
      sex: BiologicalSex.male,
      birthDate: CalendarDate(1961, 10, 6),
      heightCm: 170,
    );
    CoachingPolicy derive(CalendarDate date) => CoachingPolicy.derive(
      profile: profile,
      screening: const ScreeningAnswers(),
      today: date,
      weightKg: 80,
    );

    final dayBefore = derive(CalendarDate(2026, 10, 5));
    expect(dayBefore.maxWeeklyLossFraction, isNull);
    expect(dayBefore.minimumProteinGPerKgReferenceWeight, isNull);

    final birthday = derive(CalendarDate(2026, 10, 6));
    expect(birthday.maxWeeklyLossFraction, 0.005);
    expect(birthday.minimumProteinGPerKgReferenceWeight, 1.2);
  });

  test('a confirmed care-team discussion removes the insulin pace limit', () {
    final p = CoachingPolicy.derive(
      profile: Profile(
        sex: BiologicalSex.male,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 170,
      ),
      screening: const ScreeningAnswers(
        insulinOrSulfonylurea: true,
        insulinCareTeamConfirmed: true,
      ),
      today: today,
      weightKg: 80,
    );
    expect(p.maxWeeklyLossFraction, isNull);
  });

  test('bariatric surgery disables targets without blocking the app', () {
    final p = CoachingPolicy.derive(
      profile: Profile(
        sex: BiologicalSex.female,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 170,
      ),
      screening: const ScreeningAnswers(bariatricSurgery: true),
      today: today,
      weightKg: 80,
    );
    expect(p.blocked, isFalse);
    expect(p.targetsAllowed, isFalse);
    expect(p.cautions, contains(Caution.bariatricSurgery));
  });

  test('weight-affecting medication adds a caution without blocking', () {
    final p = policy(
      sex: BiologicalSex.male,
      heightCm: 180,
      screening: const ScreeningAnswers(weightAffectingMedication: true),
    );
    expect(p.blocked, isFalse);
    expect(p.targetsAllowed, isTrue);
    expect(p.cautions, contains(Caution.weightAffectingMedication));
  });

  test('health check becomes due on the ninetieth day', () {
    final setup = UserSetup(
      profile: Profile(
        sex: BiologicalSex.female,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 170,
      ),
      screening: const ScreeningAnswers(),
      trainingStatus: TrainingStatus.novice,
      trainingDaysPerWeek: 3,
      goalMode: GoalMode.maintenance,
      onboardedOn: CalendarDate(2026, 1, 1),
      healthCheckConfirmedOn: CalendarDate(2026, 1, 1),
    );
    expect(setup.healthCheckDueOn(CalendarDate(2026, 3, 31)), isFalse);
    expect(setup.healthCheckDueOn(CalendarDate(2026, 4, 1)), isTrue);
  });
}
