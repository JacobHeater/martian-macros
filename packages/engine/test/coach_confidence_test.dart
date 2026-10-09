import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  final asOf = CalendarDate(2026, 10, 5);

  List<IntakeDay> intakeDays(int count) => [
    for (var day = 0; day < count; day++)
      IntakeDay(
        date: asOf.addDays(-day),
        kcal: 2000,
        proteinG: 120,
        carbsG: 200,
        fatG: 60,
        completeness: DayCompleteness.complete,
      ),
  ];

  List<WeightTrendPoint> trendDays(int count) => [
    for (var day = 0; day < count; day++)
      WeightTrendPoint(
        date: asOf.addDays(-day),
        levelKg: 80,
        slopeKgPerDay: 0,
        waterKg: 0,
        levelVariance: 0.01,
        slopeVariance: 0.0001,
        observed: true,
        rejected: false,
      ),
  ];

  TdeeEstimate estimate({
    double sigma = 170,
    TdeeStatus status = TdeeStatus.updated,
    bool clamped = false,
    CalendarDate? settlingUntil,
    CalendarDate? styleRestartOn,
  }) => TdeeEstimate(
    kcal: 2500,
    sigmaKcal: sigma,
    status: status,
    clampedToBounds: clamped,
    settlingUntil: settlingUntil,
    styleRestartOn: styleRestartOn,
  );

  CoachConfidence assess({
    TdeeEstimate? tdee,
    int foods = 24,
    int weighIns = 25,
    List<TargetsRecord> history = const [],
    CalendarDate? weightEventOn,
  }) => assessCoachConfidence(
    estimate: tdee ?? estimate(),
    asOf: asOf,
    intake: intakeDays(foods),
    trend: trendDays(weighIns),
    history: history,
    lastWeightEventOn: weightEventOn,
  );

  test('good measurements and complete recent data produce Good', () {
    final confidence = assess();
    expect(confidence.level, ConfidenceLevel.good);
    expect(confidence.estimate, ConfidenceLevel.good);
    expect(confidence.foodLog, ConfidenceLevel.good);
    expect(confidence.weighIns, ConfidenceLevel.good);
    expect(confidence.stability, ConfidenceLevel.good);
  });

  test('confidence boundaries are inclusive at 200 and 350 kcal', () {
    expect(assess(tdee: estimate(sigma: 199.9)).estimate, ConfidenceLevel.good);
    expect(assess(tdee: estimate(sigma: 200)).estimate, ConfidenceLevel.fair);
    expect(assess(tdee: estimate(sigma: 350)).estimate, ConfidenceLevel.fair);
    expect(
      assess(tdee: estimate(sigma: 350.1)).estimate,
      ConfidenceLevel.learning,
    );
  });

  test('one weak data part determines the level and next step', () {
    final confidence = assess(weighIns: 9);
    expect(confidence.level, ConfidenceLevel.fair);
    expect(confidence.weighIns, ConfidenceLevel.fair);
    expect(confidence.nextStep, ConfidenceNextStep.recordWeight);
  });

  test('a new user gets a specific food logging next step', () {
    final confidence = assess(
      tdee: estimate(status: TdeeStatus.held),
      foods: 5,
      weighIns: 5,
    );
    expect(confidence.level, ConfidenceLevel.learning);
    expect(confidence.nextStep, ConfidenceNextStep.completeFoodLog);
  });

  test('food logging wins a tie with weigh-ins for the next step', () {
    final confidence = assess(
      tdee: estimate(status: TdeeStatus.held),
      foods: 6,
      weighIns: 5,
    );
    expect(confidence.foodLog, ConfidenceLevel.learning);
    expect(confidence.weighIns, ConfidenceLevel.learning);
    expect(confidence.nextStep, ConfidenceNextStep.completeFoodLog);
  });

  test('a recent phase change makes stability Fair', () {
    final changedOn = asOf.addDays(-6);
    final history = [
      TargetsRecord(
        effectiveFrom: changedOn,
        mode: GoalMode.maintenance,
        tdeeKcal: 2500,
        tdeeSigmaKcal: 170,
        tdeeStatus: TdeeStatus.updated,
        targets: const DailyTargets(
          kcal: 1900,
          proteinG: 150,
          fatG: 65,
          carbsG: 180,
          weeklyRateFraction: 0,
        ),
      ),
    ];
    final confidence = assess(history: history);
    expect(confidence.level, ConfidenceLevel.fair);
    expect(confidence.stability, ConfidenceLevel.fair);
    expect(confidence.nextStep, ConfidenceNextStep.waitForStability);
  });

  test('a recent style restart makes stability Fair', () {
    final confidence = assess(
      tdee: estimate(styleRestartOn: asOf.addDays(-10)),
    );
    expect(confidence.stability, ConfidenceLevel.fair);
    expect(confidence.nextStep, ConfidenceNextStep.waitForStability);
  });

  test('an estimate clamped to a limit is Learning and flags the food log', () {
    final confidence = assess(tdee: estimate(clamped: true));
    expect(confidence.level, ConfidenceLevel.learning);
    expect(confidence.stability, ConfidenceLevel.learning);
    expect(confidence.nextStep, ConfidenceNextStep.reviewFoodLogging);
  });

  test('recent weight events lower stability', () {
    final confidence = assess(weightEventOn: asOf.addDays(-2));
    expect(confidence.stability, ConfidenceLevel.fair);
    expect(confidence.nextStep, ConfidenceNextStep.waitForStability);
  });

  test('confidence can be stored in target explanation JSON', () {
    final confidence = assess();
    const explanation = TargetsExplanation(
      lines: [],
      newKcal: 2200,
      estimateStatus: TdeeStatus.updated,
      confidence: null,
    );
    final withConfidence = TargetsExplanation(
      lines: explanation.lines,
      newKcal: explanation.newKcal,
      estimateStatus: explanation.estimateStatus,
      confidence: confidence,
    );
    final restored = TargetsExplanation.decode(withConfidence.encode());
    expect(restored.confidence?.level, ConfidenceLevel.good);
    expect(restored.confidence?.usableFoodDays, 24);
    expect(restored.confidence?.weighInDays, 25);
  });
}
