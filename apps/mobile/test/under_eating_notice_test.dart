import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/format/under_eating_text.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-114: one neutral notice when logged days sit far below the floor.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;
  final notice = find.byKey(const ValueKey('under-eating-notice'));

  Future<void> logDays(
    int count,
    double kcal, {
    DayCompleteness mark = DayCompleteness.complete,
  }) async {
    for (var i = 1; i <= count; i++) {
      final day = today.addDays(-i);
      await repos.food.addFood(
        FoodEntry(
          id: 0,
          date: day,
          meal: Meal.dinner,
          name: 'Food',
          kcal: kcal,
          proteinG: 80,
          carbsG: 100,
          fatG: 30,
          source: QuantitySource.weighed,
        ),
      );
      await repos.dayMarks.setCompleteness(day, mark);
    }
  }

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  testWidgets('sustained low intake shows the notice with both figures', (
    tester,
  ) async {
    await logDays(9, 1050);
    await pumpApp(tester, repos, FixedClock(today));
    expect(notice, findsOneWidget);
    expect(find.textContaining('average 1,050 kcal'), findsOneWidget);
    expect(
      find.textContaining('would ever suggest for you is'),
      findsOneWidget,
    );
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    expect(notice, findsOneWidget);
  });

  testWidgets('days marked partial raise no notice', (tester) async {
    await logDays(9, 1050, mark: DayCompleteness.partial);
    await pumpApp(tester, repos, FixedClock(today));
    expect(notice, findsNothing);
  });

  testWidgets('too few days, or days at target, raise no notice', (
    tester,
  ) async {
    await logDays(4, 1000);
    await pumpApp(tester, repos, FixedClock(today));
    expect(notice, findsNothing);
  });

  testWidgets('one tap marks those days partial, and the notice goes', (
    tester,
  ) async {
    await logDays(9, 1050);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.byKey(const ValueKey('under-eating-mark-partial')));
    await tester.pumpAndSettle();
    expect(notice, findsNothing);
    final mark = await readNow(
      tester,
      () => repos.dayMarks.watchCompleteness(today.addDays(-3)).first,
    );
    expect(mark, DayCompleteness.partial);
  });

  testWidgets('dismissed, it is not shown again five days later', (
    tester,
  ) async {
    await logDays(9, 1050);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.byKey(const ValueKey('under-eating-dismiss')));
    await tester.pumpAndSettle();
    expect(notice, findsNothing);
    await pumpApp(tester, repos, FixedClock(today.addDays(5)));
    expect(notice, findsNothing);
  });

  testWidgets('the easy-to-miss line is not shown while the pattern holds', (
    tester,
  ) async {
    await logDays(9, 1050);
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.dinner,
        name: 'Dinner',
        kcal: 2000,
        proteinG: 120,
        carbsG: 220,
        fatG: 70,
        source: QuantitySource.weighed,
      ),
    );
    await repos.dayMarks.setCompleteness(today, DayCompleteness.complete);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView).first, const Offset(0, -1500));
    await tester.pumpAndSettle();
    expect(find.text('Easy to miss'), findsNothing);
  });

  test('the words praise nothing and diagnose nobody', () {
    const f = UnderEatingFinding(
      averageKcal: 1050,
      floorKcal: 1500,
      days: 9,
      lowDays: [],
    );
    final plain = underEatingText(f, supportLine: false).toLowerCase();
    for (final word in [
      'great',
      'well done',
      'good job',
      'nice',
      'disorder',
      'anorexi',
      'warning',
      'dangerous',
    ]) {
      expect(plain, isNot(contains(word)), reason: word);
    }
    expect(plain, contains('mark them partial'));
    expect(plain.indexOf('missing food'), lessThan(plain.indexOf('complete')));
    final supported = underEatingText(f, supportLine: true);
    expect(supported, contains('a doctor or a registered dietitian'));
    expect(plain, isNot(contains('dietitian')));
  });

  testWidgets('marking a very low day complete asks once', (tester) async {
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.breakfast,
        name: 'Toast',
        kcal: 200,
        proteinG: 6,
        carbsG: 30,
        fatG: 5,
        source: QuantitySource.weighed,
      ),
    );
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    final complete = find.text('Complete');
    await tester.scrollUntilVisible(complete, 300);
    await tester.tap(complete);
    await tester.pumpAndSettle();
    expect(find.text('Is this everything you ate today?'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('choice-secondary')));
    await tester.pumpAndSettle();
    expect(
      await readNow(
        tester,
        () => repos.dayMarks.watchCompleteness(today).first,
      ),
      DayCompleteness.partial,
    );
  });

  testWidgets('a fast is a legitimate yes', (tester) async {
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.breakfast,
        name: 'Coffee',
        kcal: 20,
        proteinG: 0,
        carbsG: 2,
        fatG: 1,
        source: QuantitySource.weighed,
      ),
    );
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    final complete = find.text('Complete');
    await tester.scrollUntilVisible(complete, 300);
    await tester.tap(complete);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('choice-primary')));
    await tester.pumpAndSettle();
    expect(
      await readNow(
        tester,
        () => repos.dayMarks.watchCompleteness(today).first,
      ),
      DayCompleteness.complete,
    );
  });
}
