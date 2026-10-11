import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/coach/monthly_report_screen.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-33: a monthly report on day 28, then monthly.
void main() {
  final onboarded = CalendarDate(2026, 9, 1);
  late InMemoryRepositories repos;

  Future<void> seed({
    required int daysSinceOnboarding,
    int loggedDays = 28,
    bool twoChanges = true,
  }) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: onboarded)
          .copyWith(healthCheckConfirmedOn: () => onboarded),
    );
    for (var d = 0; d < loggedDays; d++) {
      final date = onboarded.addDays(d);
      await repos.food.addFood(
        FoodEntry(
          id: 0,
          date: date,
          meal: Meal.dinner,
          name: 'Dinner',
          kcal: 2100,
          proteinG: 150,
          carbsG: 200,
          fatG: 70,
          source: QuantitySource.weighed,
        ),
      );
      await repos.dayMarks.setCompleteness(date, DayCompleteness.complete);
    }
    for (var d = 0; d <= daysSinceOnboarding; d += 2) {
      await repos.weights.saveWeight(onboarded.addDays(d), 90 - d * 0.03);
    }
    TargetsRecord record(int day, double kcal, double previous, double tdee) =>
        TargetsRecord(
          effectiveFrom: onboarded.addDays(day),
          mode: GoalMode.fatLoss,
          tdeeKcal: tdee,
          tdeeSigmaKcal: 180,
          tdeeStatus: TdeeStatus.updated,
          targets: DailyTargets(
            kcal: kcal,
            proteinG: 160,
            fatG: 70,
            carbsG: 200,
            weeklyRateFraction: -0.0075,
          ),
          explanation: TargetsExplanation(
            lines: [
              ExplanationLine(
                ExplanationReason.expenditureEstimate,
                kcal - previous,
                from: previous,
                to: kcal,
              ),
            ],
            previousKcal: previous,
            newKcal: kcal,
            estimateStatus: TdeeStatus.updated,
          ),
        );
    await repos.targets.saveTargets(record(14, 2150, 2200, 2650));
    if (twoChanges) {
      await repos.targets.saveTargets(record(21, 2050, 2150, 2580));
    }
  }

  Future<void> open(WidgetTester tester, CalendarDate today) =>
      pumpApp(tester, repos, FixedClock(today));

  Future<void> openFirstReport(WidgetTester tester, CalendarDate today) async {
    await open(tester, today);
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('report-0')),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(find.byKey(const ValueKey('report-0')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('report-0')));
    await tester.pumpAndSettle();
  }

  /// The text of the open report only, not the screens beneath it.
  String shown(WidgetTester tester) => tester
      .widgetList<Text>(
        find.descendant(
          of: find.byType(MonthlyReportScreen),
          matching: find.byType(Text, skipOffstage: false),
        ),
      )
      .map((t) => t.data ?? '')
      .join(' ');

  testWidgets('no report until 28 days have passed', (tester) async {
    await seed(daysSinceOnboarding: 27);
    await open(tester, onboarded.addDays(27));
    expect(find.byKey(const ValueKey('report-ready')), findsNothing);
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('reports-card')), findsNothing);
  });

  testWidgets('the day after day 28 the first report is ready', (tester) async {
    await seed(daysSinceOnboarding: 28);
    await open(tester, onboarded.addDays(28));
    expect(find.text('Your first month is done'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('report-ready-open')));
    await tester.pumpAndSettle();
    expect(find.text('Sep 1 – Sep 28'), findsOneWidget);
    expect(find.text('What you did'), findsOneWidget);
  });

  testWidgets('it stops announcing itself after a week', (tester) async {
    await seed(daysSinceOnboarding: 35);
    await open(tester, onboarded.addDays(35));
    expect(find.byKey(const ValueKey('report-ready')), findsNothing);
  });

  testWidgets('the report holds the work, the body and the estimate', (
    tester,
  ) async {
    await seed(daysSinceOnboarding: 28);
    await openFirstReport(tester, onboarded.addDays(28));
    expect(find.text('28 of 28'), findsOneWidget);
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('report-estimate')),
        matching: find.text('2,580 kcal a day, give or take 180.'),
      ),
      findsOneWidget,
    );
    expect(find.textContaining('Not measured'), findsNothing);
  });

  testWidgets('both target changes are listed with their estimate', (
    tester,
  ) async {
    await seed(daysSinceOnboarding: 28);
    await openFirstReport(tester, onboarded.addDays(28));
    final all = shown(tester);
    expect(all, contains('Sep 15: 2,200 to 2,150 kcal.'));
    expect(all, contains('Sep 22: 2,150 to 2,050 kcal.'));
    expect(all, contains('Based on an expenditure estimate of 2,650 kcal'));
    expect(all, contains('Based on an expenditure estimate of 2,580 kcal'));
  });

  testWidgets('six logged days: the estimate could not be measured, and why', (
    tester,
  ) async {
    await seed(daysSinceOnboarding: 28, loggedDays: 6, twoChanges: false);
    await openFirstReport(tester, onboarded.addDays(28));
    final all = shown(tester);
    expect(all, contains('Not measured this month: only 6 whole days'));
    expect(all, contains('at least 14'));
    // The estimate card shows no number; a target change still names the
    // starting estimate it was made from.
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('report-estimate')),
        matching: find.textContaining('give or take'),
      ),
      findsNothing,
    );
  });

  testWidgets('a report can be reread from the Coach screen later', (
    tester,
  ) async {
    await seed(daysSinceOnboarding: 88);
    await openFirstReport(tester, onboarded.addDays(88));
    expect(find.text('Sep 1 – Sep 28'), findsOneWidget);
    expect(find.text('28 of 28'), findsOneWidget);
  });

  Future<void> trainedOn(int day, double squatKg) async {
    final date = onboarded.addDays(day);
    final began = DateTime(date.year, date.month, date.day, 18);
    await repos.workouts.saveWorkout(
      Workout(
        id: 0,
        date: date,
        startedAt: began,
        endedAt: began.add(const Duration(minutes: 50)),
        exercises: [
          WorkoutExercise(
            exerciseId: 'back-squat',
            sets: [WorkoutSet(reps: 1, loadKg: squatKg)],
          ),
        ],
      ),
    );
  }

  testWidgets('a month with training lists the workouts and each lift', (
    tester,
  ) async {
    await seed(daysSinceOnboarding: 28);
    await trainedOn(2, 220);
    await trainedOn(23, 240);
    await openFirstReport(tester, onboarded.addDays(28));

    expect(
      find.descendant(
        of: find.byKey(const ValueKey('report-work')),
        matching: find.text('Workouts'),
      ),
      findsOneWidget,
    );
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('report-lifts')),
      200,
      scrollable: find
          .descendant(
            of: find.byType(MonthlyReportScreen),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    expect(find.text('Back squat'), findsOneWidget);
    // 220 kg then 240 kg for one rep: the estimates are 227.3 and 248 kg,
    // and the last is smoothed with the one before it.
    expect(find.text('501.2 lb to 524.0 lb (+22.8 lb)'), findsOneWidget);
    expect(shown(tester), contains('not tested'));
  });

  testWidgets('a month with one session of a lift says why none is shown', (
    tester,
  ) async {
    await seed(daysSinceOnboarding: 28);
    await trainedOn(2, 100);
    await openFirstReport(tester, onboarded.addDays(28));

    expect(shown(tester), contains('No lift had two sessions this month'));
  });

  testWidgets('a month with no training has no lifts card', (tester) async {
    await seed(daysSinceOnboarding: 28);
    await openFirstReport(tester, onboarded.addDays(28));

    expect(shown(tester), isNot(contains('Your lifts')));
    expect(shown(tester), isNot(contains('Workouts')));
  });

  testWidgets('nothing in a report grades or praises', (tester) async {
    await seed(daysSinceOnboarding: 28);
    await openFirstReport(tester, onboarded.addDays(28));
    final all = shown(tester).toLowerCase();
    for (final word in [
      'score',
      'grade',
      'great',
      'well done',
      'good job',
      'lowest',
      'on track',
      'cheat',
    ]) {
      expect(all, isNot(contains(word)), reason: word);
    }
  });
}
