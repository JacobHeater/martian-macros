import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';
import 'support/confirm_initial_theme.dart';

/// MM-164 (daily activity in the starting estimate) and MM-165 (theme
/// preference), through the app.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() => repos = InMemoryRepositories());

  /// Walks onboarding up to (and showing) the daily-activity step.
  Future<void> reachActivityStep(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await confirmInitialTheme(tester);
    await tester.tap(find.text('Get started'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Male'));
    await tester.pump();
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Choose date'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('onboarding-feet')), '5');
    await tester.enterText(
      find.byKey(const ValueKey('onboarding-inches')),
      '11',
    );
    await tester.enterText(
      find.byKey(const ValueKey('onboarding-weight')),
      '200',
    );
    await tester.pump();
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
  }

  /// Finishes onboarding from the activity step with [level] chosen, and
  /// returns the first day's calorie target.
  Future<double> finishWith(WidgetTester tester, DailyActivity level) async {
    await reachActivityStep(tester);
    await tester.tap(find.text(_label(level)));
    await tester.pump();
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.text('Next')); // activity, training, health
      await tester.pumpAndSettle();
    }
    await tester.tap(find.text('Start'));
    await tester.pumpAndSettle();
    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.dailyActivity, level);
    final history = await readNow(
      tester,
      () => repos.targets.watchTargetsHistory().first,
    );
    return history.single.targets.kcal;
  }

  group('daily activity (MM-164)', () {
    testWidgets('is asked after measurements and before training', (
      tester,
    ) async {
      await reachActivityStep(tester);
      expect(find.text('Your day'), findsOneWidget);
      for (final level in DailyActivity.values) {
        expect(find.text(_label(level)), findsOneWidget);
      }
      expect(find.textContaining('About 3,000 steps'), findsOneWidget);
      expect(find.text('Resistance training experience'), findsNothing);

      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();
      expect(find.text('Resistance training experience'), findsOneWidget);
      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();
      expect(find.text('Your day'), findsOneWidget);
    });

    testWidgets('light movement is selected until the user chooses', (
      tester,
    ) async {
      await reachActivityStep(tester);
      Finder tick(DailyActivity level) => find.descendant(
        of: find.ancestor(
          of: find.text(_label(level)),
          matching: find.byType(Material),
        ),
        matching: find.byIcon(Icons.check_circle),
      );
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      expect(tick(DailyActivity.light), findsWidgets);
      await tester.tap(find.text('Mostly seated'));
      await tester.pump();
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      expect(tick(DailyActivity.seated), findsWidgets);
    });

    testWidgets('the same person gets a higher day-one target when more '
        'active', (tester) async {
      final seated = await finishWith(tester, DailyActivity.seated);
      expect(seated, greaterThan(1200));

      repos = InMemoryRepositories();
      await tester.pumpWidget(const SizedBox());
      final physical = await finishWith(tester, DailyActivity.physicalJob);
      // Resting energy is about 1,900 kcal here: the factors differ by 0.3.
      expect(physical - seated, greaterThan(400));
    });

    testWidgets('can be changed in Settings', (tester) async {
      await repos.setup.saveSetup(typicalSetup(onboardedOn: today));
      await repos.weights.saveWeight(today, 82);
      await pumpApp(tester, repos, FixedClock(today));
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      expect(find.text('Light movement'), findsOneWidget);

      await tester.tap(find.byType(PopupMenuButton<DailyActivity>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Physical job').last);
      await tester.pumpAndSettle();

      expect(
        (await readNow(tester, repos.setup.loadSetup))!.dailyActivity,
        DailyActivity.physicalJob,
      );
      expect(find.text('Physical job'), findsOneWidget);
    });

    testWidgets('the Coach screen names every input of the starting estimate', (
      tester,
    ) async {
      await repos.setup.saveSetup(typicalSetup(onboardedOn: today));
      await repos.weights.saveWeight(today, 82);
      await pumpApp(tester, repos, FixedClock(today));
      await tester.tap(find.text('Coach'));
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(
        find.text('Your metabolism estimate'),
        300,
      );
      await tester.ensureVisible(find.text('Your metabolism estimate'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Your metabolism estimate'));
      await tester.pumpAndSettle();
      expect(
        find.textContaining(
          'sex, age, height, weight, daily activity and training days',
        ),
        findsOneWidget,
      );
    });
  });

  group('theme preference (MM-165)', () {
    Future<void> openSettings(WidgetTester tester) async {
      await repos.setup.saveSetup(typicalSetup(onboardedOn: today));
      await repos.weights.saveWeight(today, 82);
      await pumpApp(tester, repos, FixedClock(today));
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
    }

    ThemeMode mode(WidgetTester tester) =>
        tester.widget<MaterialApp>(find.byType(MaterialApp)).themeMode!;

    testWidgets('an existing System choice continues following the phone', (
      tester,
    ) async {
      await repos.preferences.saveThemePreference(ThemePreference.system);
      await openSettings(tester);
      expect(mode(tester), ThemeMode.system);
    });

    testWidgets('Dark and Light apply at once and are stored', (tester) async {
      await openSettings(tester);

      await tester.tap(find.text('Dark'));
      await tester.pumpAndSettle();
      expect(mode(tester), ThemeMode.dark);
      expect(
        Theme.of(tester.element(find.text('Appearance'))).brightness,
        Brightness.dark,
      );
      expect(
        await readNow(
          tester,
          () => repos.preferences.watchThemePreference().first,
        ),
        ThemePreference.dark,
      );

      await tester.tap(find.text('Light'));
      await tester.pumpAndSettle();
      expect(mode(tester), ThemeMode.light);
      expect(
        Theme.of(tester.element(find.text('Appearance'))).brightness,
        Brightness.light,
      );

      await tester.tap(find.text('System'));
      await tester.pumpAndSettle();
      expect(mode(tester), ThemeMode.system);
    });

    testWidgets('a stored choice is applied when the app opens', (
      tester,
    ) async {
      await repos.preferences.saveThemePreference(ThemePreference.dark);
      await openSettings(tester);
      expect(mode(tester), ThemeMode.dark);
    });
  });
}

String _label(DailyActivity level) => switch (level) {
  DailyActivity.seated => 'Mostly seated',
  DailyActivity.light => 'Light movement',
  DailyActivity.onFeet => 'On my feet most of the day',
  DailyActivity.physicalJob => 'Physical job',
};
