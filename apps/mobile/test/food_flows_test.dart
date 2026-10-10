import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/ui/mm_progress_bar.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-93: the Food screen's flows that shipped without a test (MM-38, MM-41).
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;
  late FixedClock clock;

  setUp(() {
    repos = InMemoryRepositories();
    clock = FixedClock(today);
  });

  TargetsRecord targets(
    CalendarDate from,
    double kcal, {
    double proteinG = 170,
    double? proteinMinimumG,
  }) => TargetsRecord(
    effectiveFrom: from,
    mode: GoalMode.fatLoss,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 400,
    tdeeStatus: TdeeStatus.held,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: proteinG,
      proteinMinimumG: proteinMinimumG,
      fatG: 70,
      carbsG: 250,
      weeklyRateFraction: -0.0075,
    ),
  );

  FoodEntry food(
    String name,
    double kcal,
    CalendarDate on, {
    double proteinG = 30,
  }) => FoodEntry(
    id: 0,
    date: on,
    meal: Meal.lunch,
    name: name,
    kcal: kcal,
    proteinG: proteinG,
    carbsG: 40,
    fatG: 10,
    source: QuantitySource.weighed,
  );

  Future<void> seed({
    List<TargetsRecord> history = const [],
    List<FoodEntry> foods = const [],
  }) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
    for (final h in history) {
      await repos.targets.saveTargets(h);
    }
    for (final f in foods) {
      await repos.food.addFood(f);
    }
  }

  Future<void> openFood(WidgetTester tester) async {
    await pumpApp(tester, repos, clock);
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
  }

  testWidgets('energy that disagrees with the macros is flagged', (
    tester,
  ) async {
    await seed(history: [targets(today.addDays(-40), 2400)]);
    await openFood(tester);
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('food-protein')), '45');
    await tester.enterText(find.byKey(const ValueKey('food-carbs')), '60');
    await tester.enterText(find.byKey(const ValueKey('food-fat')), '10');
    await tester.enterText(find.byKey(const ValueKey('food-kcal')), '200');
    await tester.pump();
    expect(find.textContaining('Macros add up to 510 kcal'), findsOneWidget);
  });

  testWidgets('swiping an entry deletes it', (tester) async {
    await seed(
      history: [targets(today.addDays(-40), 2400)],
      foods: [food('Chicken and rice', 510, today)],
    );
    await openFood(tester);
    expect(find.text('Chicken and rice'), findsOneWidget);
    await tester.ensureVisible(find.text('Chicken and rice'));
    await tester.pumpAndSettle();
    await tester.drag(find.text('Chicken and rice'), const Offset(-800, 0));
    await tester.pumpAndSettle();
    expect(find.text('Chicken and rice'), findsNothing);
    final left = await readNow(tester, () => repos.food.watchFood(today).first);
    expect(left, isEmpty);
  });

  testWidgets('food can be logged to a past day', (tester) async {
    await seed(history: [targets(today.addDays(-40), 2400)]);
    await openFood(tester);
    await tester.tap(find.byTooltip('Previous day'));
    await tester.pumpAndSettle();
    expect(find.text('Yesterday'), findsOneWidget);
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('food-name')), 'Pasta');
    await tester.enterText(find.byKey(const ValueKey('food-kcal')), '600');
    await tester.pump();
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final yesterday = await readNow(
      tester,
      () => repos.food.watchFood(today.addDays(-1)).first,
    );
    final todays = await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    );
    expect(yesterday.single.name, 'Pasta');
    expect(todays, isEmpty);
  });

  testWidgets('being over target is stated plainly', (tester) async {
    await seed(
      history: [targets(today.addDays(-40), 2400)],
      foods: [food('Big meal', 3000, today)],
    );
    await openFood(tester);
    expect(find.text('600'), findsOneWidget);
    expect(find.text('kcal over 2,400'), findsOneWidget);
  });

  testWidgets('protein shows the minimum and target as separate marks', (
    tester,
  ) async {
    await seed(
      history: [
        targets(today.addDays(-40), 2400, proteinG: 160, proteinMinimumG: 128),
      ],
      foods: [food('Protein-rich day', 700, today, proteinG: 135)],
    );
    await openFood(tester);

    expect(find.textContaining('135 g · min 128 · target 160'), findsWidgets);
    final proteinBar = tester.widget<MmProgressBar>(
      find.byType(MmProgressBar).first,
    );
    expect(proteinBar.markers, [0.8, 1]);
  });

  testWidgets('a past day is measured against the targets of that day', (
    tester,
  ) async {
    await seed(
      history: [targets(today.addDays(-40), 2400), targets(today, 2000)],
      foods: [food('Old meal', 1000, today.addDays(-1))],
    );
    await openFood(tester);
    expect(find.textContaining('left of 2,000'), findsOneWidget);
    await tester.tap(find.byTooltip('Previous day'));
    await tester.pumpAndSettle();
    expect(find.textContaining('left of 2,400'), findsOneWidget);
    expect(find.text('1,400'), findsOneWidget);
  });

  testWidgets('the day picker steps back and returns to today', (tester) async {
    await seed(history: [targets(today.addDays(-40), 2400)]);
    await openFood(tester);
    await tester.tap(find.byTooltip('Previous day'));
    await tester.pumpAndSettle();
    expect(find.text('Yesterday'), findsOneWidget);
    await tester.tap(find.text('Yesterday'));
    await tester.pumpAndSettle();
    expect(find.text('Today'), findsWidgets);
    // There is no tomorrow to step to.
    final next = tester.widget<IconButton>(
      find.widgetWithIcon(IconButton, Icons.chevron_right),
    );
    expect(next.onPressed, isNull);
  });
}
