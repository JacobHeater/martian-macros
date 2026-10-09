import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-83: correct the profile or the health check without losing data.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() => repos = InMemoryRepositories());

  Future<void> seed({
    BiologicalSex sex = BiologicalSex.male,
    ScreeningAnswers screening = const ScreeningAnswers(),
    GoalMode mode = GoalMode.fatLoss,
  }) async {
    await repos.setup.saveSetup(
      typicalSetup(
        sex: sex,
        screening: screening,
        goalMode: mode,
        onboardedOn: today.addDays(-60),
      ),
    );
    for (var d = 20; d >= 0; d--) {
      await repos.weights.saveWeight(today.addDays(-d), 80);
    }
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.lunch,
        name: 'Chicken and rice',
        kcal: 510,
        proteinG: 45,
        carbsG: 60,
        fatG: 10,
        source: QuantitySource.weighed,
      ),
    );
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-2),
        mode: mode,
        tdeeKcal: 2800,
        tdeeSigmaKcal: 250,
        tdeeStatus: TdeeStatus.updated,
        targets: DailyTargets(
          kcal: mode == GoalMode.maintenance ? 2800 : 2300,
          proteinG: 170,
          fatG: 70,
          carbsG: 250,
          weeklyRateFraction: mode == GoalMode.maintenance ? 0 : -0.0075,
        ),
      ),
    );
  }

  Future<void> openSettings(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Biological sex'), 300);
  }

  Future<List<TargetsRecord>> history(WidgetTester tester) =>
      readNow(tester, () => repos.targets.watchTargetsHistory().first);

  testWidgets('correcting sex recalculates at once and keeps the data', (
    tester,
  ) async {
    await seed();
    await openSettings(tester);
    await tester.tap(find.text('Biological sex'));
    await tester.pumpAndSettle();
    expect(find.text('Change biological sex?'), findsOneWidget);
    expect(
      find.textContaining('food log and weigh-ins are kept'),
      findsOneWidget,
    );
    await tester.tap(find.text('Change'));
    await tester.pumpAndSettle();

    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.profile.sex, BiologicalSex.female);
    expect(setup.profileRevision, 1);
    final h = await history(tester);
    expect(h.length, 2, reason: 'new targets were issued at once');
    expect(h.last.effectiveFrom.epochDay, today.epochDay);
    expect(
      await readNow(tester, () => repos.weights.watchWeights().first),
      hasLength(21),
    );
    expect(
      await readNow(tester, () => repos.food.watchFood(today).first),
      hasLength(1),
    );
  });

  testWidgets('cancelling the sex change changes nothing', (tester) async {
    await seed();
    await openSettings(tester);
    await tester.tap(find.text('Biological sex'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.profile.sex, BiologicalSex.male);
    expect(setup.profileRevision, 0);
  });

  testWidgets('changing to male clears the female-only answers', (
    tester,
  ) async {
    await seed(
      sex: BiologicalSex.female,
      screening: const ScreeningAnswers(
        breastfeeding: true,
        eatingDisorderHistory: true,
      ),
      mode: GoalMode.maintenance,
    );
    await openSettings(tester);
    await tester.tap(find.text('Biological sex'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Change'));
    await tester.pumpAndSettle();
    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.profile.sex, BiologicalSex.male);
    expect(setup.screening.breastfeeding, isFalse);
    expect(setup.screening.eatingDisorderHistory, isTrue);
  });

  testWidgets('becoming pregnant makes the goal maintenance at once', (
    tester,
  ) async {
    await seed(sex: BiologicalSex.female);
    await openSettings(tester);
    await tester.scrollUntilVisible(find.text('Health check'), 300);
    await tester.ensureVisible(find.text('Health check'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Health check'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Pregnant'));
    await tester.pumpAndSettle();

    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.screening.pregnant, isTrue);
    expect(setup.goalMode, GoalMode.maintenance);
    final h = await history(tester);
    expect(h.last.mode, GoalMode.maintenance);
    expect(h.last.targets.weeklyRateFraction, 0);
    expect(h.last.targets.flags, contains(TargetFlag.modeNotAllowed));
  });

  testWidgets('new screening answers can be changed in Settings', (
    tester,
  ) async {
    await seed();
    await openSettings(tester);
    await tester.scrollUntilVisible(find.text('Health check'), 300);
    await tester.ensureVisible(find.text('Health check'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Health check'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('A medication I take can change my weight or water retention'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(
      find.text('A medication I take can change my weight or water retention'),
    );
    await tester.pumpAndSettle();

    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.screening.weightAffectingMedication, isTrue);
    expect(setup.profileRevision, 1);
    expect(setup.healthCheckConfirmedOn, today);
  });

  testWidgets('no longer breastfeeding removes the 400 kcal and offers every '
      'goal again', (tester) async {
    await seed(
      sex: BiologicalSex.female,
      screening: const ScreeningAnswers(breastfeeding: true),
      mode: GoalMode.maintenance,
    );
    await openSettings(tester);
    await tester.scrollUntilVisible(find.text('Health check'), 300);
    await tester.ensureVisible(find.text('Health check'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Health check'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Breastfeeding'));
    await tester.pumpAndSettle();

    final h = await history(tester);
    expect(h.length, 2);
    expect(h.last.effectiveFrom.epochDay, today.epochDay);
    expect(h.last.targets.flags, isNot(contains(TargetFlag.modeNotAllowed)));
    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.screening.breastfeeding, isFalse);

    // Every goal is offered again.
    await tester.tap(find.byTooltip('Back'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Back'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Change'),
      300,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.ensureVisible(find.text('Change'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Change'));
    await tester.pumpAndSettle();
    for (final label in ['Fat loss', 'Recomp', 'Lean gain', 'Maintenance']) {
      expect(find.text(label), findsOneWidget, reason: label);
    }
  });

  testWidgets('a date of birth that makes the user under 18 stops coaching', (
    tester,
  ) async {
    await seed();
    await openSettings(tester);
    await tester.tap(find.text('Date of birth'));
    await tester.pumpAndSettle();
    // The date picker opens on the year view; pick 2012 then confirm.
    await tester.scrollUntilVisible(
      find.text('2012'),
      100,
      scrollable: find
          .descendant(
            of: find.byType(YearPicker),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await tester.ensureVisible(find.text('2012'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('2012'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    // Back out of Settings.
    await tester.tap(find.byTooltip('Back'));
    await tester.pumpAndSettle();
    expect(find.text('Martian Macros is for adults'), findsOneWidget);
  });

  testWidgets('height can be corrected', (tester) async {
    await seed();
    await openSettings(tester);
    await tester.tap(find.text('Height'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('height-feet')), '6');
    await tester.enterText(find.byKey(const ValueKey('height-inches')), '2');
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('height-save')));
    await tester.pumpAndSettle();
    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.profile.heightCm, closeTo(187.96, 0.1));
    expect(setup.profileRevision, 1);
  });

  testWidgets('an implausible height cannot be saved', (tester) async {
    await seed();
    await openSettings(tester);
    await tester.tap(find.text('Height'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('height-feet')), '2');
    await tester.enterText(find.byKey(const ValueKey('height-inches')), '0');
    await tester.pump();
    final save = tester.widget<FilledButton>(
      find.ancestor(of: find.text('Save'), matching: find.byType(FilledButton)),
    );
    expect(save.onPressed, isNull);
  });
}
