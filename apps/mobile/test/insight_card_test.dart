import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/format/fmt.dart';
import 'package:martian_macros/src/format/insight_text.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-141: one rationed insight, in fixed words, with its evidence.
void main() {
  final today = CalendarDate(2026, 10, 5);
  const fmt = Fmt(UnitSystem.metric);

  Insight insight(InsightRule rule, [Map<String, double> figures = const {}]) =>
      Insight(
        rule: rule,
        from: today.addDays(-14),
        to: today.addDays(-1),
        figures: figures,
        stall: rule == InsightRule.stall
            ? const StallAssessment(
                status: StallStatus.stalled,
                windowDays: 21,
                diagnosis: StallDiagnosis.intake,
                averageIntakeKcal: 2350,
                averageTargetKcal: 2100,
                usableFoodDays: 20,
                weighIns: 18,
              )
            : null,
      );

  final every = [
    insight(InsightRule.partialDays, {'loggedDays': 13, 'partialDays': 5}),
    insight(InsightRule.estimatesRising, {
      'wholeDays': 14,
      'estimatedShare': 0.6,
    }),
    insight(InsightRule.weighInTiming, {'weighIns': 5}),
    insight(InsightRule.proteinShort, {
      'wholeDays': 14,
      'metDays': 5,
      'averageShortfallG': 28,
    }),
    insight(InsightRule.stall),
    insight(InsightRule.proteinByMeal, {
      'meal': 0,
      'missedDays': 10,
      'lowDays': 8,
    }),
  ];

  test('every rule in the catalog has words', () {
    expect({for (final i in every) i.rule}, InsightRule.values.toSet());
    for (final i in every) {
      final (title, body, evidence) = insightText(i, fmt);
      expect(title, isNotEmpty);
      expect(body, isNotEmpty);
      expect(evidence, isNotEmpty, reason: 'the evidence is viewable');
    }
  });

  test('the protein insight states both figures', () {
    final (_, body, evidence) = insightText(every[3], fmt);
    expect(body, contains('5 of 14 fully logged days'));
    expect(body, contains('about 28 g short'));
    expect(evidence, contains(('Average shortfall', '28 g')));
  });

  test('the protein-by-meal insight names the meal and grades itself', () {
    final (_, body, evidence) = insightText(every[5], fmt);
    expect(body, contains('breakfast has almost none'));
    expect(body, contains('may help slightly'));
    expect(body, contains('your daily total matters much more'));
    expect(evidence, contains(('Days under the minimum', '10')));
  });

  test('forbidden subjects never appear', () {
    for (final i in every) {
      final (title, body, evidence) = insightText(i, fmt);
      final all = [
        title,
        body,
        for (final (label, value) in evidence) '$label $value',
      ].join(' ').toLowerCase();
      for (final word in [
        'great',
        'well done',
        'good',
        'bad',
        'cheat',
        'guilt',
        'clean',
        'junk',
        'lowest weight',
        'new low',
        'other people',
        'most people',
        'average person',
        'by christmas',
        'you will reach',
        'you should',
        'you must',
      ]) {
        expect(all, isNot(contains(word)), reason: '$word in ${i.rule.name}');
      }
    }
  });

  group('on the dashboard', () {
    late InMemoryRepositories repos;

    Future<void> shortOnProtein() async {
      repos = InMemoryRepositories();
      await repos.setup.saveSetup(
        typicalSetup(onboardedOn: today.addDays(-60)),
      );
      await repos.targets.saveTargets(
        TargetsRecord(
          effectiveFrom: today.addDays(-50),
          mode: GoalMode.maintenance,
          tdeeKcal: 2500,
          tdeeSigmaKcal: 150,
          tdeeStatus: TdeeStatus.updated,
          targets: const DailyTargets(
            kcal: 2500,
            proteinG: 160,
            proteinMinimumG: 130,
            fatG: 80,
            carbsG: 280,
            weeklyRateFraction: 0,
          ),
        ),
      );
      for (var i = 0; i <= 20; i++) {
        final day = today.addDays(-i);
        await repos.weights.saveWeight(day, 82);
        if (i == 0) continue;
        await repos.food.addFood(
          FoodEntry(
            id: 0,
            date: day,
            meal: Meal.dinner,
            name: 'Food',
            kcal: 2500,
            proteinG: 100,
            carbsG: 300,
            fatG: 90,
            source: QuantitySource.weighed,
          ),
        );
        await repos.dayMarks.setCompleteness(day, DayCompleteness.complete);
      }
    }

    final card = find.byKey(const ValueKey('insight-proteinShort'));

    testWidgets('a pattern is shown once, with its evidence', (tester) async {
      await shortOnProtein();
      await pumpApp(tester, repos, FixedClock(today));
      await tester.scrollUntilVisible(card, 300);
      expect(
        find.descendant(
          of: card,
          matching: find.textContaining('about 30 g short'),
        ),
        findsOneWidget,
      );
      await tester.ensureVisible(find.text('What this rests on'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('What this rests on'));
      await tester.pumpAndSettle();
      expect(find.text('Days at or above the minimum'), findsOneWidget);
      final log = await readNow(
        tester,
        () => repos.insightLog.watchInsightLog().first,
      );
      expect(log.single.rule, InsightRule.proteinShort);
      expect(log.single.shownOn, today);
    });

    testWidgets('Dismiss is never under the Add food button', (tester) async {
      // Regression: right-aligned, Dismiss sat beneath the floating button
      // and could not be tapped until the list was scrolled further.
      await shortOnProtein();
      await pumpApp(tester, repos, FixedClock(today));
      final dismiss = find.byKey(const ValueKey('insight-dismiss'));
      final addFood = find.text('Add food');
      final list = find.byType(ListView).first;
      // At every scroll position where Dismiss is on screen.
      for (var step = 0; step < 12; step++) {
        if (dismiss.evaluate().isNotEmpty) {
          final button = tester.getRect(dismiss);
          final fab = tester.getRect(addFood).inflate(8);
          expect(
            button.overlaps(fab),
            isFalse,
            reason: 'Dismiss at $button is under Add food at $fab',
          );
        }
        await tester.drag(list, const Offset(0, -80));
        await tester.pumpAndSettle();
      }
      expect(dismiss, findsOneWidget, reason: 'the card was reached');
      await tester.tap(dismiss);
      await tester.pumpAndSettle();
      expect(card, findsNothing);
    });

    testWidgets('dismissed, it does not come back ten days later', (
      tester,
    ) async {
      await shortOnProtein();
      await pumpApp(tester, repos, FixedClock(today));
      await tester.scrollUntilVisible(card, 300);
      final dismiss = find.byKey(const ValueKey('insight-dismiss'));
      await tester.ensureVisible(dismiss);
      await tester.pumpAndSettle();
      await tester.tap(dismiss);
      await tester.pumpAndSettle();
      expect(card, findsNothing);
      for (var i = 1; i <= 10; i++) {
        final day = today.addDays(i);
        await repos.weights.saveWeight(day, 82);
        await repos.food.addFood(
          FoodEntry(
            id: 0,
            date: day,
            meal: Meal.dinner,
            name: 'Food',
            kcal: 2500,
            proteinG: 100,
            carbsG: 300,
            fatG: 90,
            source: QuantitySource.weighed,
          ),
        );
        await repos.dayMarks.setCompleteness(day, DayCompleteness.complete);
      }
      await pumpApp(tester, repos, FixedClock(today.addDays(10)));
      expect(card, findsNothing);
    });

    testWidgets('a well-logged fortnight on target shows no insight', (
      tester,
    ) async {
      repos = InMemoryRepositories();
      await repos.setup.saveSetup(
        typicalSetup(onboardedOn: today.addDays(-60)),
      );
      await repos.weights.saveWeight(today, 82);
      await pumpApp(tester, repos, FixedClock(today));
      expect(find.byKey(const ValueKey('insight-dismiss')), findsNothing);
    });
  });
}
