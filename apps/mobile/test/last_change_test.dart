import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/format/explanation_line_text.dart';
import 'package:martian_macros/src/format/fmt.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-138: the Coach screen says when targets last changed and why.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() => repos = InMemoryRepositories());

  TargetsRecord record(
    int daysAgo,
    double kcal, {
    TargetsExplanation? explanation,
    double tdee = 2900,
  }) => TargetsRecord(
    effectiveFrom: today.addDays(-daysAgo),
    mode: GoalMode.fatLoss,
    tdeeKcal: tdee,
    tdeeSigmaKcal: 250,
    tdeeStatus: TdeeStatus.updated,
    explanation: explanation,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: 170,
      fatG: 70,
      carbsG: kcal == 2325 ? 240 : 255,
      weeklyRateFraction: -0.0075,
    ),
  );

  Future<void> seed(List<TargetsRecord> history) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-60)));
    for (var d = 20; d >= 0; d--) {
      await repos.weights.saveWeight(today.addDays(-d), 82);
    }
    for (final r in history) {
      await repos.targets.saveTargets(r);
    }
  }

  Future<void> openCoach(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
  }

  final ordinary = TargetsExplanation(
    lines: const [
      ExplanationLine(
        ExplanationReason.expenditureEstimate,
        -90,
        from: 2950,
        to: 2860,
      ),
      ExplanationLine(ExplanationReason.stepLimit, 15),
    ],
    previousKcal: 2400,
    newKcal: 2325,
    estimateStatus: TdeeStatus.updated,
    usableIntakeDays: 12,
    excludedPartialDays: 2,
    weighIns: 11,
  );

  testWidgets('an ordinary change shows old and new, then the account', (
    tester,
  ) async {
    await seed([record(14, 2400), record(2, 2325, explanation: ordinary)]);
    await openCoach(tester);

    expect(find.textContaining('Last change'), findsOneWidget);
    expect(find.textContaining('Calories 2,400 → 2,325'), findsOneWidget);
    expect(find.text('See why'), findsOneWidget);

    await tester.tap(find.text('See why'));
    await tester.pumpAndSettle();
    expect(find.text('What changed'), findsOneWidget);
    expect(
      find.textContaining('Calories 2,400 → 2,325. Protein target unchanged'),
      findsOneWidget,
    );
    expect(find.textContaining('Carbohydrate 255 → 240 g'), findsOneWidget);
    expect(find.text('Why'), findsOneWidget);
    expect(
      find.textContaining(
        'Your expenditure is 2,860 kcal a day, down from '
        '2,950 (−90)',
      ),
      findsWidgets,
    );
    expect(
      find.textContaining(
        'Weekly changes are limited, so 15 kcal of the '
        'decrease is held for next week',
      ),
      findsOneWidget,
    );
    expect(find.text('What it was based on'), findsOneWidget);
    expect(
      find.textContaining(
        '12 days of food, 2 left out as partial and 11 '
        'weigh-ins',
      ),
      findsOneWidget,
    );
    expect(find.text('What would change it'), findsOneWidget);
  });

  testWidgets('targets from before explanations were kept say so', (
    tester,
  ) async {
    await seed([record(14, 2400), record(7, 2325)]);
    await openCoach(tester);
    expect(
      find.text('No explanation was recorded for these targets.'),
      findsOneWidget,
    );
  });

  testWidgets('the first targets are described as such', (tester) async {
    await seed([
      record(
        3,
        2400,
        explanation: const TargetsExplanation(
          lines: [ExplanationLine(ExplanationReason.firstTargets, 2400)],
          newKcal: 2400,
          estimateStatus: TdeeStatus.held,
        ),
      ),
    ]);
    await openCoach(tester);
    expect(find.text('Your first targets.'), findsOneWidget);
  });

  testWidgets('a check-in with no material change says why', (tester) async {
    await seed([
      record(9, 2400),
      record(
        2,
        2400,
        explanation: const TargetsExplanation(
          lines: [],
          previousKcal: 2400,
          newKcal: 2400,
          estimateStatus: TdeeStatus.updated,
          usableIntakeDays: 14,
          weighIns: 12,
        ),
      ),
    ]);
    await openCoach(tester);
    expect(
      find.textContaining(
        'Checked ${Fmt.day(today.addDays(-2), today)}. No change:',
      ),
      findsOneWidget,
    );
    await tester.tap(find.text('See why'));
    await tester.pumpAndSettle();
    expect(
      find.text(
        'No calculated contribution was large enough to move the '
        'calorie target.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('a rounded contribution remainder is shown in the account', (
    tester,
  ) async {
    await seed([
      record(9, 2400),
      record(
        2,
        2398,
        explanation: const TargetsExplanation(
          lines: [
            ExplanationLine(
              ExplanationReason.expenditureEstimate,
              -1,
              from: 2900,
              to: 2899,
            ),
          ],
          previousKcal: 2400,
          newKcal: 2398,
          estimateStatus: TdeeStatus.updated,
          usableIntakeDays: 14,
          weighIns: 12,
        ),
      ),
    ]);
    await openCoach(tester);
    await tester.tap(find.text('See why'));
    await tester.pumpAndSettle();
    expect(find.text('And −1 kcal from rounding and limits.'), findsOneWidget);
  });

  testWidgets('three weeks with no food logged: targets are unchanged for '
      'lack of data, and what is needed', (tester) async {
    await seed([record(30, 2400)]);
    await openCoach(tester);
    expect(
      find.textContaining(
        'Targets are unchanged because there is not enough '
        'data yet',
      ),
      findsOneWidget,
    );
    expect(
      find.textContaining('Needs 10 more fully logged days'),
      findsWidgets,
    );
  });

  testWidgets('an app rule update is named as the cause', (tester) async {
    await seed([
      record(9, 2400),
      record(
        2,
        2325,
        explanation: const TargetsExplanation(
          lines: [ExplanationLine(ExplanationReason.appRuleUpdate, -75)],
          previousKcal: 2400,
          newKcal: 2325,
          estimateStatus: TdeeStatus.updated,
          usableIntakeDays: 14,
          weighIns: 12,
        ),
      ),
    ]);
    await openCoach(tester);
    expect(
      find.textContaining('The target rules changed in an app update'),
      findsOneWidget,
    );
  });

  test('no explanation line puts the change down to what the user ate', () {
    for (final reason in ExplanationReason.values) {
      final text = ExplanationLine(
        reason,
        -75,
        from: 2400,
        to: 2325,
      ).text.toLowerCase();
      for (final blame in [
        'because you ate',
        'you ate',
        'went over',
        'overate',
        'because you went',
        'your eating',
      ]) {
        expect(text, isNot(contains(blame)), reason: reason.name);
      }
    }
  });
}
