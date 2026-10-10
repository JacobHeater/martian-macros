import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/dashboard/dashboard_history.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

void main() {
  final today = CalendarDate(2026, 10, 10);
  IntakeDay food(int daysAgo, double kcal, {bool complete = false}) => IntakeDay(
    date: today.addDays(-daysAgo),
    kcal: kcal,
    proteinG: kcal / 15,
    carbsG: 200,
    fatG: 60,
    completeness: complete ? DayCompleteness.complete : DayCompleteness.unmarked,
  );
  TargetsRecord target(int daysAgo, double kcal) => TargetsRecord(
    effectiveFrom: today.addDays(-daysAgo),
    mode: GoalMode.fatLoss,
    tdeeKcal: 2800,
    tdeeSigmaKcal: 200,
    tdeeStatus: TdeeStatus.updated,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: 170,
      proteinMinimumG: 150,
      fatG: 70,
      carbsG: 250,
      weeklyRateFraction: -0.0075,
    ),
  );
  DashboardHistory facts({
    int days = 7,
    List<IntakeDay> intake = const [],
    List<TargetsRecord> history = const [],
    List<Pause> pauses = const [],
    List<WeightObservation> weights = const [],
    CalendarDate? onboardedOn,
    bool allowed = true,
  }) => DashboardHistory(
    today: today,
    days: days,
    intake: intake,
    history: history,
    pauses: pauses,
    weights: weights,
    onboardedOn: onboardedOn ?? today.addDays(-60),
    targetsAllowed: allowed,
  );

  test('missing days are gaps; averages only include recorded days', () {
    final result = facts(intake: [food(0, 1000), food(2, 2000)]);
    expect(result.calories.length, 2);
    expect(result.calories.containsKey(today.addDays(-1)), isFalse);
    expect(result.meanCalories, 1500);
    expect(result.meanProtein, 100);
    expect(result.loggedDays, 2);
    expect(result.activeDays, 7);
  });

  test('inclusive range excludes older and future observations', () {
    final result = facts(intake: [food(6, 2000), food(7, 800), food(-1, 900)]);
    expect(result.calories, {today.addDays(-6): 2000});
    expect(result.meanCalories, 2000);
    expect(facts(days: 30, intake: [food(7, 800)]).calories.length, 1);
  });

  test('empty averages are absent, never invented zero measurements', () {
    final result = facts();
    expect(result.meanCalories, isNull);
    expect(result.meanProtein, isNull);
  });

  test('a deliberately completed zero-intake day is an observation', () {
    final result = facts(intake: [food(0, 0, complete: true)]);
    expect(result.calories[today], 0);
    expect(result.completeDays, 1);
  });

  test('uses targets in force per day, never backdates first targets', () {
    final result = facts(history: [target(4, 2400), target(1, 2300)]);
    expect(result.calorieTargets[today.addDays(-5)], isNull);
    expect(result.calorieTargets[today.addDays(-4)], 2400);
    expect(result.calorieTargets[today.addDays(-1)], 2300);
    expect(result.proteinTargets[today], 150);
  });

  test('paused observations stay visible but are not counted or targeted', () {
    final result = facts(
      intake: [food(0, 2100, complete: true), food(1, 2000, complete: true)],
      history: [target(7, 2300)],
      pauses: [
        Pause(from: today, to: today, reason: PauseReason.travel),
      ],
      weights: [WeightObservation(date: today, weightKg: 80)],
    );
    expect(result.calories[today], 2100);
    expect(result.activeDays, 6);
    expect(result.loggedDays, 1);
    expect(result.completeDays, 1);
    expect(result.weighInDays, 0);
    expect(result.calorieTargets.containsKey(today), isFalse);
  });

  test('screening suppresses target comparisons, not logged facts', () {
    final result = facts(
      allowed: false,
      history: [target(7, 2300)],
      intake: [food(0, 2100)],
    );
    expect(result.calorieTargets, isEmpty);
    expect(result.proteinTargets, isEmpty);
    expect(result.calories[today], 2100);
  });

  test('coverage does not count days before onboarding', () {
    final result = facts(
      onboardedOn: today.addDays(-1),
      intake: [food(2, 2000), food(1, 2100), food(0, 2200)],
    );
    expect(result.activeDays, 2);
    expect(result.loggedDays, 2);
    expect(result.meanCalories, 2150);
  });
}
