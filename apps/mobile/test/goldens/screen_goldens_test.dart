import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/app/martian_macros_app.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import '../support/pump_app.dart';
import 'load_golden_fonts.dart';

/// Screenshot tests (MM-105): every main screen, light and dark, with fixed
/// data and a fixed clock. The images are generated on Linux only, because
/// text renders differently on each operating system: `mm goldens --update`
/// there, or the "Update goldens" workflow. A changed image is reviewed in the
/// pull request that changes it.
void main() {
  final today = CalendarDate(2026, 10, 5);
  final linux = Platform.isLinux;

  setUpAll(() async {
    if (linux) await loadGoldenFonts();
    // Tests flatten shadows by default; the screens have soft ones.
    debugDisableShadows = false;
  });

  Future<InMemoryRepositories> seeded({required bool dark}) async {
    final repos = InMemoryRepositories();
    await repos.preferences.saveThemePreference(
      dark ? ThemePreference.dark : ThemePreference.light,
    );
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-45), goalMode: GoalMode.fatLoss),
    );
    for (var d = 30; d >= 0; d--) {
      await repos.weights.saveWeight(
        today.addDays(-d),
        84.0 - (30 - d) * 0.06 + (d.isEven ? 0.25 : -0.25),
      );
    }
    final meals = [
      ('Oats with milk', Meal.breakfast, 380.0, 18.0, 58.0, 9.0),
      ('Chicken and rice', Meal.lunch, 610.0, 48.0, 70.0, 12.0),
      ('Greek yogurt', Meal.snack, 150.0, 17.0, 9.0, 4.0),
    ];
    for (final (name, meal, kcal, p, c, f) in meals) {
      await repos.food.addFood(
        FoodEntry(
          id: 0,
          date: today,
          meal: meal,
          name: name,
          kcal: kcal,
          proteinG: p,
          carbsG: c,
          fatG: f,
          source: QuantitySource.weighed,
        ),
      );
    }
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-14),
        mode: GoalMode.fatLoss,
        tdeeKcal: 2950,
        tdeeSigmaKcal: 280,
        tdeeStatus: TdeeStatus.updated,
        targets: const DailyTargets(
          kcal: 2400,
          proteinG: 170,
          fatG: 70,
          carbsG: 255,
          weeklyRateFraction: -0.0075,
        ),
      ),
    );
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-7),
        mode: GoalMode.fatLoss,
        tdeeKcal: 2860,
        tdeeSigmaKcal: 260,
        tdeeStatus: TdeeStatus.updated,
        targets: const DailyTargets(
          kcal: 2325,
          proteinG: 170,
          fatG: 70,
          carbsG: 240,
          weeklyRateFraction: -0.0075,
        ),
        explanation: const TargetsExplanation(
          lines: [
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
        ),
      ),
    );
    return repos;
  }

  Future<void> open(
    WidgetTester tester,
    InMemoryRepositories repos, {
    String? tab,
  }) async {
    await pumpApp(tester, repos, FixedClock(today));
    // A small phone, so one screenshot shows what a user sees first.
    tester.view.physicalSize = const Size(720, 1600);
    tester.view.devicePixelRatio = 2;
    await tester.pumpAndSettle();
    if (tab != null) {
      await tester.tap(find.text(tab));
      await tester.pumpAndSettle();
    }
  }

  Future<void> shot(WidgetTester tester, String name) => expectLater(
    find.byType(MartianMacrosApp),
    matchesGoldenFile('images/$name.png'),
  );

  for (final dark in [false, true]) {
    final mode = dark ? 'dark' : 'light';

    testWidgets('dashboard, $mode', (tester) async {
      await open(tester, await seeded(dark: dark));
      await shot(tester, 'dashboard_$mode');
    }, skip: !linux);

    testWidgets('food, $mode', (tester) async {
      await open(tester, await seeded(dark: dark), tab: 'Food');
      await shot(tester, 'food_$mode');
    }, skip: !linux);

    testWidgets('progress, $mode', (tester) async {
      await open(tester, await seeded(dark: dark), tab: 'Progress');
      await shot(tester, 'progress_$mode');
    }, skip: !linux);

    testWidgets('coach, $mode', (tester) async {
      await open(tester, await seeded(dark: dark), tab: 'Coach');
      await shot(tester, 'coach_$mode');
    }, skip: !linux);

    testWidgets('why targets changed, $mode', (tester) async {
      await open(tester, await seeded(dark: dark), tab: 'Coach');
      await tester.ensureVisible(find.text('See why'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('See why'));
      await tester.pumpAndSettle();
      expect(find.text('What changed'), findsOneWidget);
      await shot(tester, 'why_$mode');
    }, skip: !linux);

    testWidgets('settings, $mode', (tester) async {
      await open(tester, await seeded(dark: dark));
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      await shot(tester, 'settings_$mode');
    }, skip: !linux);

    testWidgets('onboarding, $mode', (tester) async {
      final repos = InMemoryRepositories();
      await repos.preferences.saveThemePreference(
        dark ? ThemePreference.dark : ThemePreference.light,
      );
      await open(tester, repos);
      await shot(tester, 'onboarding_$mode');
    }, skip: !linux);
  }
}
