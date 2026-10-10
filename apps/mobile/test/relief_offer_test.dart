import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/format/pace_label.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-117: an offer to ease a deficit when recovery is failing.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  Future<void> seed({
    GoalMode goal = GoalMode.fatLoss,
    int hardWeeks = 2,
  }) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        goalMode: goal,
        onboardedOn: today.addDays(-200),
      ).copyWith(healthCheckConfirmedOn: () => today.addDays(-30)),
    );
    await repos.weights.saveWeight(today, 82);
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-3),
        mode: goal,
        tdeeKcal: 2600,
        tdeeSigmaKcal: 300,
        tdeeStatus: TdeeStatus.held,
        targetRulesVersion: currentTargetRulesVersion,
        targets: DailyTargets(
          kcal: 2000,
          proteinG: 160,
          fatG: 70,
          carbsG: 200,
          weeklyRateFraction: goal == GoalMode.leanGain ? 0.0025 : -0.0075,
        ),
      ),
    );
    for (var week = 0; week < hardWeeks; week++) {
      await repos.recovery.saveRecoveryCheckIn(
        RecoveryCheckIn(
          date: today.addDays(-1 - 7 * week),
          hunger: 1,
          energy: 2,
          sleep: 1,
          training: 4,
          mood: 3,
          sleepHours: 5.5,
        ),
      );
    }
  }

  Future<UserSetup> setup(WidgetTester tester) async =>
      (await readNow<UserSetup?>(tester, repos.setup.loadSetup))!;
  Future<List<TargetsRecord>> history(WidgetTester tester) =>
      readNow(tester, () => repos.targets.watchTargetsHistory().first);

  Future<void> choose(WidgetTester tester, String key) async {
    final button = find.byKey(ValueKey(key));
    await tester.ensureVisible(button);
    await tester.pumpAndSettle();
    await tester.tap(button);
    await tester.pumpAndSettle();
  }

  test('a pace reads as a percent a week', () {
    expect(paceLabel(0.005), '0.5% a week');
    expect(paceLabel(0.0075), '0.75% a week');
    expect(paceLabel(0.01), '1% a week');
  });

  testWidgets('two hard weeks on a cut bring the offer, with its reasons', (
    tester,
  ) async {
    await seed();
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.byKey(const ValueKey('relief-offer')), findsOneWidget);
    expect(find.text('Two hard weeks in a row'), findsOneWidget);
    expect(find.textContaining('The coach would'), findsOneWidget);
    expect(find.textContaining('appears to shift loss'), findsOneWidget);
    expect(find.text('Take a maintenance week'), findsOneWidget);
    expect(find.text('Slow to 0.5% a week'), findsOneWidget);
    expect(find.text('Carry on'), findsOneWidget);
  });

  testWidgets('it never suggests eating less or moving more', (tester) async {
    await seed();
    await pumpApp(tester, repos, FixedClock(today));
    final all = tester
        .widgetList<Text>(
          find.descendant(
            of: find.byKey(const ValueKey('relief-offer')),
            matching: find.byType(Text),
          ),
        )
        .map((t) => t.data ?? '')
        .join(' ')
        .toLowerCase();
    for (final phrase in [
      'eat less',
      'fewer calories',
      'cut calories',
      'cardio',
      'train more',
      'exercise',
      'push through',
      'try harder',
    ]) {
      expect(all, isNot(contains(phrase)), reason: phrase);
    }
  });

  testWidgets('one hard week brings nothing', (tester) async {
    await seed(hardWeeks: 1);
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.byKey(const ValueKey('relief-offer')), findsNothing);
  });

  testWidgets('it is not made on lean gain', (tester) async {
    await seed(goal: GoalMode.leanGain);
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.byKey(const ValueKey('relief-offer')), findsNothing);
  });

  testWidgets('Carry on changes nothing and the offer goes', (tester) async {
    await seed();
    await pumpApp(tester, repos, FixedClock(today));
    final before = await history(tester);
    await choose(tester, 'relief-carry-on');
    expect(find.byKey(const ValueKey('relief-offer')), findsNothing);
    final after = await setup(tester);
    expect(after.reliefAnsweredOn, today);
    expect(after.maintenanceWeekFrom, isNull);
    expect(after.requestedLossFraction, isNull);
    final now = await history(tester);
    expect(now, hasLength(before.length));
    expect(now.last.targets.kcal, before.last.targets.kcal);
  });

  testWidgets('a maintenance week puts targets at maintenance at once', (
    tester,
  ) async {
    await seed();
    await pumpApp(tester, repos, FixedClock(today));
    final before = await history(tester);
    await choose(tester, 'relief-maintenance-week');
    expect(find.byKey(const ValueKey('relief-offer')), findsNothing);
    expect((await setup(tester)).maintenanceWeekFrom, today);
    final now = await history(tester);
    expect(now.length, before.length + 1);
    expect(now.last.effectiveFrom, today);
    expect(now.last.targets.flags, contains(TargetFlag.requestedBreak));
    expect(now.last.targets.weeklyRateFraction, 0);
    expect(now.last.targets.kcal, greaterThan(before.last.targets.kcal));
  });

  testWidgets('a slower pace is stored, and never a lower target', (
    tester,
  ) async {
    await seed();
    await pumpApp(tester, repos, FixedClock(today));
    final before = await history(tester);
    await choose(tester, 'relief-slower-pace');
    expect(find.byKey(const ValueKey('relief-offer')), findsNothing);
    final after = await setup(tester);
    expect(after.requestedLossFraction, 0.005);
    expect(after.reliefAnsweredOn, today);
    final now = await history(tester);
    expect(
      now.last.targets.kcal,
      greaterThanOrEqualTo(before.last.targets.kcal),
    );
  });
}
