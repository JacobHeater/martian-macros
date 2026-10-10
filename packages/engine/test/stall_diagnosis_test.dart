import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/trend_points.dart';

/// MM-140: when progress stalls, which kind of stall it is.
void main() {
  final today = CalendarDate(2026, 3, 1);

  UserSetup setupFor(BiologicalSex sex) => UserSetup(
    profile: Profile(
      sex: sex,
      birthDate: CalendarDate(1994, 3, 1),
      heightCm: 175,
    ),
    screening: const ScreeningAnswers(),
    trainingStatus: TrainingStatus.intermediate,
    trainingDaysPerWeek: 3,
    goalMode: GoalMode.fatLoss,
    onboardedOn: today.addDays(-90),
  );

  TargetsRecord record({
    int daysAgo = 60,
    double kcal = 2100,
    double rate = -0.0075,
    double tdee = 2700,
  }) => TargetsRecord(
    effectiveFrom: today.addDays(-daysAgo),
    mode: rate > 0 ? GoalMode.leanGain : GoalMode.fatLoss,
    tdeeKcal: tdee,
    tdeeSigmaKcal: 200,
    tdeeStatus: TdeeStatus.updated,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: 160,
      proteinMinimumG: 130,
      fatG: 70,
      carbsG: 220,
      weeklyRateFraction: rate,
    ),
  );

  CoachSnapshot snapshot({
    BiologicalSex sex = BiologicalSex.male,
    double lossFraction = 0,
    double tdee = 2400,
    double floor = 1500,
    ConfidenceLevel level = ConfidenceLevel.fair,
    CalendarDate? creatineOn,
  }) {
    final setup = setupFor(sex);
    return CoachSnapshot(
      policy: CoachingPolicy.derive(
        profile: setup.profile,
        screening: setup.screening,
        today: today,
      ),
      trend: trendOf(
        start: today.addDays(-40),
        days: 41,
        levelKg: 85,
        lossFractionPerWeek: lossFraction,
      ),
      trendWeightKg: 85,
      bodyFat: const BodyFatEstimate(percent: 25, sigmaPercent: 2),
      bmrKcal: 1800,
      calorieFloorKcal: floor,
      tdee: TdeeEstimate(
        kcal: tdee,
        sigmaKcal: 200,
        status: TdeeStatus.updated,
        usableIntakeDays: 28,
        excludedPartialDays: 0,
        weighIns: 28,
      ),
      confidence: CoachConfidence(
        level: level,
        estimate: ConfidenceLevel.good,
        foodLog: ConfidenceLevel.good,
        weighIns: ConfidenceLevel.good,
        stability: ConfidenceLevel.fair,
        nextStep: ConfidenceNextStep.keepLogging,
        usableFoodDays: 28,
        weighInDays: 28,
      ),
      recommendation: const ModeRecommendation(
        GoalMode.fatLoss,
        ModeReason.cutFirst,
      ),
      lastCreatineEventOn: creatineOn,
    );
  }

  List<IntakeDay> ate(double kcal, {int days = 30}) => [
    for (var i = 1; i <= days; i++)
      IntakeDay(
        date: today.addDays(-i),
        kcal: kcal,
        proteinG: 150,
        carbsG: 200,
        fatG: 70,
        completeness: DayCompleteness.complete,
      ),
  ];
  List<WeightObservation> weighed({int days = 30}) => [
    for (var i = 1; i <= days; i++)
      WeightObservation(date: today.addDays(-i), weightKg: 85),
  ];

  StallAssessment assess({
    BiologicalSex sex = BiologicalSex.male,
    CoachSnapshot? snap,
    List<TargetsRecord>? history,
    List<IntakeDay>? intake,
    List<WeightObservation>? weights,
    List<WaistObservation> waist = const [],
    List<WeightEvent> events = const [],
  }) => assessStall(
    setup: setupFor(sex),
    snapshot: snap ?? snapshot(sex: sex),
    history: history ?? [record()],
    intake: intake ?? ate(2100),
    weights: weights ?? weighed(),
    waist: waist,
    weightEvents: events,
    today: today,
  );

  test('ten days into a new cut is too early to tell', () {
    final a = assess(history: [record(daysAgo: 10)]);
    expect(a.status, StallStatus.notAssessed);
    expect(a.notAssessedReason, StallNotAssessedReason.earlyInPhase);
  });

  test('losing at the intended pace is no stall', () {
    final a = assess(snap: snapshot(lossFraction: 0.0075));
    expect(a.status, StallStatus.noStall);
  });

  test('it is defined against the goal, not against zero', () {
    expect(
      assess(snap: snapshot(lossFraction: 0.0075 / 4)).status,
      StallStatus.stalled,
      reason: 'a quarter of the intended pace',
    );
    expect(
      assess(snap: snapshot(lossFraction: 0.0075 / 2)).status,
      StallStatus.noStall,
      reason: 'half the intended pace',
    );
  });

  test('not assessed while the coach is still learning', () {
    final a = assess(snap: snapshot(level: ConfidenceLevel.learning));
    expect(a.notAssessedReason, StallNotAssessedReason.lowConfidence);
  });

  test('not assessed within two weeks of starting creatine', () {
    final a = assess(snap: snapshot(creatineOn: today.addDays(-5)));
    expect(a.notAssessedReason, StallNotAssessedReason.recentLastingEvent);
  });

  test('maintenance has no pace to fall short of', () {
    final a = assess(history: [record(rate: 0)]);
    expect(a.notAssessedReason, StallNotAssessedReason.noPaceToMeet);
  });

  test('thin data: the log is too thin to tell', () {
    final a = assess(intake: ate(2100, days: 7));
    expect(a.diagnosis, StallDiagnosis.data);
    expect(a.usableFoodDays, 7);
    expect(assess(weights: weighed(days: 6)).diagnosis, StallDiagnosis.data);
  });

  test('masked by water: the waist is down while the scale held', () {
    final a = assess(
      waist: [
        for (final (i, cm) in [(20, 92.0), (14, 91.4), (7, 90.6), (1, 90.0)])
          WaistObservation(date: today.addDays(-i), waistCm: cm),
      ],
    );
    expect(a.diagnosis, StallDiagnosis.masked);
    expect(a.waistChangeCm, closeTo(-2, 1e-9));
    expect(a.expectedChangeKcal, isNull, reason: 'nothing to change');
  });

  test('a waist change inside its noise is not masking', () {
    final a = assess(
      waist: [
        for (final (i, cm) in [(20, 92.0), (10, 91.5), (1, 91.2)])
          WaistObservation(date: today.addDays(-i), waistCm: cm),
      ],
    );
    expect(a.diagnosis, isNot(StallDiagnosis.masked));
  });

  test('masked by a recent passing event', () {
    final a = assess(
      events: [
        WeightEvent(
          date: today.addDays(-4),
          type: WeightEventType.largeOrSaltyMeal,
        ),
      ],
    );
    expect(a.diagnosis, StallDiagnosis.masked);
    expect(a.maskedByEvent, isTrue);
  });

  test('intake above target: both figures are stated', () {
    final a = assess(intake: ate(2350));
    expect(a.diagnosis, StallDiagnosis.intake);
    expect(a.averageIntakeKcal, 2350);
    expect(a.averageTargetKcal, 2100);
  });

  test('the figures match the adherence summary for the same period', () {
    final intake = ate(2350);
    final a = assess(intake: intake);
    final s = summarizeAdherence(
      through: today.addDays(-1),
      intake: intake,
      weights: weighed(),
      history: [record()],
      days: a.windowDays,
    );
    expect(a.averageIntakeKcal, s.averageIntakeKcal);
    expect(a.averageTargetKcal, s.averageTargetKcal);
  });

  test('the estimate was high: on target, good data, flat weight', () {
    final a = assess();
    expect(a.diagnosis, StallDiagnosis.estimate);
    // The estimate fell 300 below the 2,700 the target was built on; one
    // check-in moves the target by at most the weekly limit.
    expect(a.expectedChangeKcal, -100);
    expect(a.atFloor, isFalse);
  });

  test('at the floor no reduction is possible', () {
    final a = assess(
      snap: snapshot(tdee: 2000, floor: 1800),
      history: [record(kcal: 1800)],
      intake: ate(1800),
    );
    expect(a.diagnosis, StallDiagnosis.estimate);
    expect(a.atFloor, isTrue);
    expect(a.expectedChangeKcal, isNull);
  });

  test('a very low estimate is flagged only under that diagnosis', () {
    expect(assess(snap: snapshot(tdee: 2300)).estimateLow, isTrue);
    expect(assess(snap: snapshot(tdee: 2400)).estimateLow, isFalse);
    expect(
      assess(snap: snapshot(tdee: 2300), intake: ate(2350)).estimateLow,
      isFalse,
    );
  });

  test('a female profile without cycle data waits for 28 days', () {
    final early = assess(
      sex: BiologicalSex.female,
      history: [record(daysAgo: 24)],
    );
    expect(early.windowDays, 28);
    expect(early.notAssessedReason, StallNotAssessedReason.earlyInPhase);
    expect(
      assess(sex: BiologicalSex.female, history: [record(daysAgo: 30)]).status,
      StallStatus.stalled,
    );
  });

  test('lean gain has the mirror: no gain, intake below target', () {
    final a = assess(history: [record(rate: 0.0025)], intake: ate(1850));
    expect(a.status, StallStatus.stalled);
    expect(a.gaining, isTrue);
    expect(a.diagnosis, StallDiagnosis.intake);
  });
}
