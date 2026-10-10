import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-92: reward the work, never the deficit.
void main() {
  final today = CalendarDate(2026, 10, 14);
  late InMemoryRepositories repos;

  Future<void> seed({bool eatingDisorderHistory = false}) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        onboardedOn: today.addDays(-60),
        screening: ScreeningAnswers(
          eatingDisorderHistory: eatingDisorderHistory,
        ),
      ).copyWith(healthCheckConfirmedOn: () => today.addDays(-30)),
    );
    await repos.weights.saveWeight(today, 82);
  }

  Future<void> logWholeDay(int daysAgo, {double kcal = 2100}) async {
    final date = today.addDays(-daysAgo);
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: date,
        meal: Meal.dinner,
        name: 'Dinner',
        kcal: kcal,
        proteinG: 150,
        carbsG: 200,
        fatG: 70,
        source: QuantitySource.weighed,
      ),
    );
    await repos.dayMarks.setCompleteness(date, DayCompleteness.complete);
  }

  String card(WidgetTester tester) => tester
      .widgetList<Text>(
        find.descendant(
          of: find.byKey(const ValueKey('process-card')),
          matching: find.byType(Text),
        ),
      )
      .map((t) => t.data ?? '')
      .join(' ');

  Future<void> open(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    // The Dashboard is a long lazy list: scroll until the card is built.
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('process-card')),
      300,
      scrollable: find.byType(Scrollable).first,
    );
  }

  testWidgets('a run of whole days is acknowledged quietly', (tester) async {
    await seed();
    for (var d = 1; d <= 6; d++) {
      await logWholeDay(d);
    }
    await open(tester);
    expect(card(tester), contains('6 whole days logged in a row.'));
    expect(card(tester), isNot(contains('forgiven')));
  });

  testWidgets('one missed day does not reset it, and says so', (tester) async {
    await seed();
    for (final d in [1, 2, 3, 4, 5, 6, 8]) {
      await logWholeDay(d);
    }
    await open(tester);
    expect(card(tester), contains('7 whole days logged in a row.'));
    expect(card(tester), contains('A missed day is forgiven, once a week.'));
  });

  testWidgets('two days at 1,700 and 2,800 kcal earn the same', (tester) async {
    await seed();
    await logWholeDay(1, kcal: 1700);
    await logWholeDay(2, kcal: 2800);
    await logWholeDay(3);
    await open(tester);
    expect(card(tester), contains('3 whole days logged in a row.'));
  });

  testWidgets('a short run says nothing at all', (tester) async {
    await seed();
    await logWholeDay(1);
    await logWholeDay(2);
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.byKey(const ValueKey('process-card')), findsNothing);
  });

  testWidgets('it never mentions weight, deficit or eating less', (
    tester,
  ) async {
    await seed();
    for (var d = 1; d <= 10; d++) {
      await logWholeDay(d, kcal: 1500);
    }
    await open(tester);
    final all = card(tester).toLowerCase();
    for (final word in [
      'lowest',
      'deficit',
      'under target',
      'under your target',
      'lost',
      'weight',
      'record',
      'best',
      'streak of low',
      'calories',
      'kcal',
    ]) {
      expect(all, isNot(contains(word)), reason: word);
    }
  });

  testWidgets('with an eating-disorder history nothing refers to weight', (
    tester,
  ) async {
    await seed(eatingDisorderHistory: true);
    for (var d = 1; d <= 5; d++) {
      await logWholeDay(d);
    }
    await open(tester);
    expect(card(tester), contains('5 whole days logged in a row.'));
    expect(card(tester).toLowerCase(), isNot(contains('weight')));
    expect(card(tester).toLowerCase(), isNot(contains('lost')));
  });

  testWidgets('a pause does not break it', (tester) async {
    await seed();
    await repos.pauses.savePause(
      Pause(
        from: today.addDays(-9),
        to: today.addDays(-3),
        reason: PauseReason.travel,
      ),
    );
    for (final d in [1, 2, 10, 11, 12]) {
      await logWholeDay(d);
    }
    await open(tester);
    expect(card(tester), contains('5 whole days logged in a row.'));
  });
}
