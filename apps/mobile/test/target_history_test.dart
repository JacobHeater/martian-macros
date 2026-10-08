import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-138: the history of targets, and keeping last week's targets once.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() => repos = InMemoryRepositories());

  TargetsRecord record(
    int daysAgo,
    double kcal, {
    TargetsExplanation? explanation,
    Set<TargetFlag> flags = const {},
  }) => TargetsRecord(
    effectiveFrom: today.addDays(-daysAgo),
    mode: GoalMode.fatLoss,
    tdeeKcal: 2900,
    tdeeSigmaKcal: 250,
    tdeeStatus: TdeeStatus.updated,
    explanation: explanation,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: 170,
      fatG: 70,
      carbsG: 240,
      weeklyRateFraction: -0.0075,
      flags: flags,
    ),
  );

  TargetsExplanation reduction(double from, double to) => TargetsExplanation(
    lines: [
      ExplanationLine(
        ExplanationReason.expenditureEstimate,
        to - from,
        from: 2900,
        to: 2900 + to - from,
      ),
    ],
    previousKcal: from,
    newKcal: to,
    estimateStatus: TdeeStatus.updated,
    usableIntakeDays: 12,
    weighIns: 11,
  );

  Future<void> seed(List<TargetsRecord> history) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-90)));
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

  Future<List<TargetsRecord>> history(WidgetTester tester) =>
      readNow(tester, () => repos.targets.watchTargetsHistory().first);

  testWidgets('the history lists every set of targets, newest first, and each '
      'opens its reasons', (tester) async {
    await seed([
      for (var i = 0; i < 6; i++)
        record(
          (5 - i) * 7,
          2400.0 - i * 25,
          explanation: i == 0
              ? null
              : reduction(2400.0 - (i - 1) * 25, 2400.0 - i * 25),
        ),
    ]);
    await openCoach(tester);
    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();

    expect(find.text('Target history'), findsOneWidget);
    expect(find.textContaining(' kcal · P 170'), findsNWidgets(6));
    expect(find.textContaining('2,275 kcal'), findsOneWidget, reason: 'newest');

    await tester.tap(find.textContaining('2,375 kcal'));
    await tester.pumpAndSettle();
    expect(find.text('What changed'), findsOneWidget);
    expect(find.textContaining('Calories 2,400 → 2,375'), findsOneWidget);
  });

  testWidgets('an older record offers no hold, whatever it was', (
    tester,
  ) async {
    await seed([
      record(14, 2400),
      record(7, 2325, explanation: reduction(2400, 2325)),
      record(0, 2250, explanation: reduction(2325, 2250)),
    ]);
    await openCoach(tester);
    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('2,325 kcal'));
    await tester.pumpAndSettle();
    expect(find.text('What changed'), findsOneWidget);
    expect(find.text('Keep last week’s targets for now'), findsNothing);
  });

  testWidgets('a reduction can be kept for now, once', (tester) async {
    await seed([
      record(7, 2400),
      record(0, 2325, explanation: reduction(2400, 2325)),
    ]);
    await openCoach(tester);
    await tester.tap(find.text('See why'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Keep last week’s targets for now'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Keep last week’s targets for now'));
    await tester.pumpAndSettle();

    final h = await history(tester);
    expect(h.length, 2, reason: 'the day\'s record was replaced');
    expect(h.last.targets.kcal, 2400);
    expect(h.last.targets.flags, {TargetFlag.heldByUser});
    expect(find.textContaining('Calories unchanged'), findsNothing);
    expect(find.textContaining('kept last week'), findsWidgets);
  });

  testWidgets('not offered on an increase', (tester) async {
    await seed([
      record(7, 2325),
      record(0, 2400, explanation: reduction(2325, 2400)),
    ]);
    await openCoach(tester);
    await tester.tap(find.text('See why'));
    await tester.pumpAndSettle();
    expect(find.text('What changed'), findsOneWidget);
    expect(find.text('Keep last week’s targets for now'), findsNothing);
  });

  testWidgets('not offered the week after a hold', (tester) async {
    final held = TargetsRecord(
      effectiveFrom: today.addDays(-7),
      mode: GoalMode.fatLoss,
      tdeeKcal: 2900,
      tdeeSigmaKcal: 250,
      tdeeStatus: TdeeStatus.updated,
      targets: const DailyTargets(
        kcal: 2400,
        proteinG: 170,
        fatG: 70,
        carbsG: 240,
        weeklyRateFraction: -0.0075,
        flags: {TargetFlag.heldByUser},
      ),
    );
    await seed([
      record(14, 2400),
      held,
      record(0, 2325, explanation: reduction(2400, 2325)),
    ]);
    await openCoach(tester);
    await tester.tap(find.text('See why'));
    await tester.pumpAndSettle();
    expect(find.text('What changed'), findsOneWidget);
    expect(find.text('Keep last week’s targets for now'), findsNothing);
  });
}
