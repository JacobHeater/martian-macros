import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-93: Coach flows that shipped without a test (MM-25), and the first
/// adaptive check-in driven through the app with stored data (MM-24).
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() => repos = InMemoryRepositories());

  Future<void> seedHistory({
    required int days,
    required double dayOneKcal,
  }) async {
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-days)),
    );
    for (var d = days; d >= 0; d--) {
      final date = today.addDays(-d);
      await repos.weights.saveWeight(date, 82.0 + (d.isEven ? 0.2 : -0.2));
      await repos.food.addFood(
        FoodEntry(
          id: 0,
          date: date,
          meal: Meal.lunch,
          name: 'Day $d',
          kcal: 2600,
          proteinG: 160,
          carbsG: 280,
          fatG: 80,
          source: QuantitySource.weighed,
        ),
      );
      await repos.dayMarks.setCompleteness(date, DayCompleteness.complete);
    }
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-days),
        mode: GoalMode.fatLoss,
        tdeeKcal: 2600,
        tdeeSigmaKcal: 400,
        tdeeStatus: TdeeStatus.held,
        targets: DailyTargets(
          kcal: dayOneKcal,
          proteinG: 160,
          fatG: 70,
          carbsG: 250,
          weeklyRateFraction: -0.0075,
        ),
      ),
    );
  }

  testWidgets('changing the goal applies at once', (tester) async {
    await seedHistory(days: 30, dayOneKcal: 2500);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Goal: Fat loss'), 300);
    expect(find.text('Goal: Fat loss'), findsOneWidget);
    await tester.tap(find.text('Change'));
    await tester.pumpAndSettle();
    expect(find.text('Choose a goal'), findsOneWidget);
    await tester.tap(find.text('Maintenance'));
    await tester.pumpAndSettle();
    expect(find.text('Goal: Maintenance'), findsOneWidget);
    final setup = (await readNow<UserSetup?>(tester, repos.setup.loadSetup))!;
    expect(setup.goalMode, GoalMode.maintenance);
  });

  testWidgets('targets follow a goal change in the app', (tester) async {
    await seedHistory(days: 30, dayOneKcal: 2000);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Goal: Fat loss'), 300);
    await tester.tap(find.text('Change'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Maintenance'));
    await tester.pumpAndSettle();
    final history = await readNow(
      tester,
      () => repos.targets.watchTargetsHistory().first,
    );
    expect(history.length, greaterThanOrEqualTo(2));
    expect(history.last.mode, GoalMode.maintenance);
    expect(
      history.last.targets.kcal - history.first.targets.kcal,
      greaterThan(100),
    );
  });

  testWidgets('the first adaptive check-in runs through the app', (
    tester,
  ) async {
    // Thirty days of complete logs at maintenance; targets issued on day one.
    await seedHistory(days: 30, dayOneKcal: 2600);
    await pumpApp(tester, repos, FixedClock(today));
    final history = await readNow(
      tester,
      () => repos.targets.watchTargetsHistory().first,
    );
    expect(history.length, 2, reason: 'a check-in record was added');
    expect(history.last.effectiveFrom.epochDay, today.epochDay);
    expect(history.last.tdeeStatus, TdeeStatus.updated);
  });
}
