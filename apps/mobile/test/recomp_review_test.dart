import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/coach/monthly_report_screen.dart';
import 'package:martian_macros/src/format/recomp_review_text.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-133: the recomp review on the Coach screen, and what it says.
void main() {
  final today = CalendarDate(2026, 10, 5);

  RecompReview review(
    RecompVerdict? verdict, {
    int week = 12,
    GoalMode? nextGoal,
    List<RecompMeasure> missing = const [],
  }) => RecompReview(
    week: week,
    periodDays: week == 8 ? 56 : 84,
    verdict: verdict,
    missing: missing,
    waistMeasurements: 2,
    nextGoal: nextGoal,
  );

  final every = [
    review(RecompVerdict.working),
    review(RecompVerdict.slowCut, nextGoal: GoalMode.fatLoss),
    review(RecompVerdict.slowCut),
    review(RecompVerdict.probablyWorking),
    review(RecompVerdict.tooEarly, week: 8),
    review(RecompVerdict.notWorking),
    review(RecompVerdict.notWorking, nextGoal: GoalMode.fatLoss),
    review(RecompVerdict.notWorking, nextGoal: GoalMode.leanGain),
    review(RecompVerdict.notWorking, nextGoal: GoalMode.maintenance),
    review(null, missing: RecompMeasure.values),
  ];

  group('what the coach says', () {
    test('working: carry on', () {
      expect(
        recompReviewText(review(RecompVerdict.working)),
        contains('Carry on.'),
      );
    });

    test('a slow cut is called what it is, and offers the gentle pace', () {
      final text = recompReviewText(
        review(RecompVerdict.slowCut, nextGoal: GoalMode.fatLoss),
      );
      expect(text, contains('You are losing weight, which is fine.'));
      expect(text, contains('Fat loss at the Gentle pace'));
      expect(
        recompReviewText(review(RecompVerdict.slowCut)),
        isNot(contains('Fat loss at')),
      );
    });

    test('too early says when the next review is', () {
      expect(
        recompReviewText(review(RecompVerdict.tooEarly, week: 8)),
        contains('The next review is at twelve weeks.'),
      );
    });

    test('not working comes with a next step and its reason', () {
      expect(
        recompReviewText(
          review(RecompVerdict.notWorking, nextGoal: GoalMode.fatLoss),
        ),
        contains('At your body fat a fat loss phase'),
      );
      expect(
        recompReviewText(
          review(RecompVerdict.notWorking, nextGoal: GoalMode.leanGain),
        ),
        contains('building needs a surplus'),
      );
      expect(
        recompReviewText(review(RecompVerdict.notWorking)),
        contains('the training is the place to look first'),
      );
    });

    test('missing data says exactly what is missing', () {
      final text = recompReviewText(
        review(null, missing: [RecompMeasure.waist]),
      );
      expect(text, startsWith('No verdict yet.'));
      expect(text, contains('at least four waist measurements'));
      expect(text, contains('(there are 2)'));
      expect(text, isNot(contains('lifts')));
    });

    test('no verdict claims a measurement, blames or gives orders', () {
      for (final r in every) {
        final text = recompReviewText(r).toLowerCase();
        for (final word in [
          'gained muscle',
          'lost fat',
          'fail',
          'should',
          'must',
          'bad',
          'cheat',
        ]) {
          expect(text, isNot(contains(word)), reason: '$word in "$text"');
        }
      }
    });
  });

  group('on the Coach screen', () {
    late InMemoryRepositories repos;

    Future<void> setUpUser(GoalMode goal) async {
      repos = InMemoryRepositories();
      await repos.setup.saveSetup(
        typicalSetup(
          onboardedOn: today.addDays(-100),
          goalMode: goal,
        ).copyWith(unitSystem: UnitSystem.metric),
      );
      for (var d = 100; d >= 0; d--) {
        await repos.weights.saveWeight(
          today.addDays(-d),
          82 + (d.isEven ? 0.2 : -0.2),
        );
      }
      for (var d = 84; d >= 0; d -= 7) {
        await repos.targets.saveTargets(
          TargetsRecord(
            effectiveFrom: today.addDays(-d),
            mode: goal,
            tdeeKcal: 2500,
            tdeeSigmaKcal: 150,
            tdeeStatus: TdeeStatus.updated,
            targets: const DailyTargets(
              kcal: 2400,
              proteinG: 160,
              fatG: 70,
              carbsG: 250,
              weeklyRateFraction: -0.001,
            ),
          ),
        );
      }
    }

    Future<void> measuredWeekly() async {
      for (var d = 84; d >= 0; d -= 7) {
        await repos.waist.saveWaist(today.addDays(-d), 89 + 3 * d / 84);
      }
    }

    Future<void> trainedWeekly() async {
      for (var week = 12; week >= 0; week--) {
        final date = today.addDays(-1 - week * 7);
        final start = DateTime(date.year, date.month, date.day, 18);
        await repos.workouts.saveWorkout(
          Workout(
            id: 0,
            date: date,
            startedAt: start,
            endedAt: start.add(const Duration(minutes: 50)),
            exercises: [
              WorkoutExercise(
                exerciseId: 'back-squat',
                sets: [WorkoutSet(reps: 6, loadKg: 100.0 + (12 - week))],
              ),
              WorkoutExercise(
                exerciseId: 'barbell-row',
                sets: [WorkoutSet(reps: 6, loadKg: 60.0 + (12 - week))],
              ),
            ],
          ),
        );
      }
    }

    final card = find.byKey(const ValueKey('recomp-review'));

    Future<void> openCoach(WidgetTester tester) async {
      await pumpApp(tester, repos, FixedClock(today));
      await tester.tap(find.text('Coach').last);
      await tester.pumpAndSettle();
      final list = find.byType(Scrollable).first;
      for (var i = 0; i < 12 && card.evaluate().isEmpty; i++) {
        await tester.drag(list, const Offset(0, -300));
        await tester.pumpAndSettle();
      }
    }

    String cardText(WidgetTester tester) => tester
        .widget<Text>(find.byKey(const ValueKey('recomp-review-text')))
        .data!;

    testWidgets('twelve weeks, waist down and lifts up: working, with the '
        'facts, and the goal unchanged', (tester) async {
      await setUpUser(GoalMode.recomp);
      await measuredWeekly();
      await trainedWeekly();
      await openCoach(tester);

      expect(find.text('Recomp review, week 12'), findsOneWidget);
      expect(cardText(tester), startsWith('It is working.'));
      expect(find.text('84 days'), findsOneWidget);
      // Smoothed at each end (MM-155), so a little under the 3 cm entered.
      expect(find.text('Down 2.5 cm'), findsOneWidget);
      expect(find.textContaining('Up: '), findsOneWidget);
      expect(find.textContaining('not a measurement of it'), findsOneWidget);
      final setup = await readNow(tester, () => repos.setup.watchSetup().first);
      expect(setup!.goalMode, GoalMode.recomp);
    });

    testWidgets('without waist measurements it gives no verdict and says '
        'what is missing', (tester) async {
      await setUpUser(GoalMode.recomp);
      await trainedWeekly();
      await openCoach(tester);

      expect(cardText(tester), startsWith('No verdict yet.'));
      expect(cardText(tester), contains('(there are 0)'));
    });

    testWidgets('the monthly report of the month it fell due in holds it '
        'too', (tester) async {
      await setUpUser(GoalMode.recomp);
      await measuredWeekly();
      await trainedWeekly();
      await pumpApp(tester, repos, FixedClock(today));
      await tester.tap(find.text('Coach').last);
      await tester.pumpAndSettle();
      // Coaching began 100 days ago and recomp 84: the third report covers
      // days 40 to 67 of it, and the week 8 review fell due on day 56.
      final report = find.byKey(const ValueKey('report-2'));
      await tester.scrollUntilVisible(
        report,
        300,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.ensureVisible(report);
      await tester.pumpAndSettle();
      await tester.tap(report);
      await tester.pumpAndSettle();

      final card = find.byKey(const ValueKey('report-recomp-review'));
      await tester.scrollUntilVisible(
        card,
        200,
        scrollable: find
            .descendant(
              of: find.byType(MonthlyReportScreen),
              matching: find.byType(Scrollable),
            )
            .first,
      );
      expect(
        find.descendant(of: card, matching: find.text('Recomp review, week 8')),
        findsOneWidget,
      );
    });

    testWidgets('there is no review on another goal', (tester) async {
      await setUpUser(GoalMode.maintenance);
      await measuredWeekly();
      await trainedWeekly();
      await openCoach(tester);

      expect(card, findsNothing);
    });
  });
}
