import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/app/martian_macros_app.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() => repos = InMemoryRepositories());

  Future<void> pumpApp(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.5;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          clockProvider.overrideWithValue(FixedClock(today)),
        ],
        child: const MartianMacrosApp(),
      ),
    );
    await tester.pumpAndSettle();
  }

  /// Unmounts the app and lets pending stream timers fire.
  Future<void> shutDown(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 1));
    await tester.runAsync(repos.close);
  }

  Future<void> seedSetup(
    WidgetTester tester, {
    GoalMode mode = GoalMode.fatLoss,
    UnitSystem units = UnitSystem.imperial,
  }) async {
    await tester.runAsync(() async {
      await repos.weights.saveWeight(today, 90);
      await repos.setup.saveSetup(
        UserSetup(
          profile: Profile(
            sex: BiologicalSex.male,
            birthDate: CalendarDate(1990, 1, 1),
            heightCm: 180,
          ),
          screening: const ScreeningAnswers(),
          trainingStatus: TrainingStatus.intermediate,
          trainingDaysPerWeek: 3,
          goalMode: mode,
          onboardedOn: today,
          unitSystem: units,
        ),
      );
    });
  }

  /// Runs a real database call outside the widget tester's fake clock.
  Future<T> io<T>(WidgetTester tester, Future<T> Function() body) async =>
      (await tester.runAsync(body)) as T;

  testWidgets('onboarding requires sex and birth date, then creates a plan', (
    tester,
  ) async {
    await pumpApp(tester);
    expect(find.text('Biological sex'), findsOneWidget);

    FilledButton next() =>
        tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Next'));
    expect(next().onPressed, isNull, reason: 'nothing chosen yet');

    await tester.tap(find.text('Male'));
    await tester.pump();
    expect(next().onPressed, isNull, reason: 'sex alone is not enough');

    await tester.tap(find.text('Choose date'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    expect(next().onPressed, isNotNull);
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    expect(next().onPressed, isNull, reason: 'measurements missing');
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

    expect(find.text('Your day'), findsOneWidget);
    await tester.tap(find.text('Next')); // activity
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next')); // training
    await tester.pumpAndSettle();
    // Male profile: female-only questions are not offered.
    expect(find.text('Pregnant'), findsNothing);
    expect(find.text('Chronic kidney disease'), findsOneWidget);
    await tester.tap(find.text('Next')); // health
    await tester.pumpAndSettle();

    expect(find.text('Recommended'), findsOneWidget);
    await tester.tap(find.text('Start'));
    await tester.pumpAndSettle();

    final setup = (await io(tester, repos.setup.loadSetup))!;
    expect(setup.profile.sex, BiologicalSex.male);
    expect(setup.profile.heightCm, closeTo(180.3, 0.1));
    final weights = await io(tester, () => repos.weights.watchWeights().first);
    expect(weights.single.weightKg, closeTo(90.7, 0.1));

    // Lands on the main shell with targets already issued.
    expect(find.text('Add food'), findsOneWidget);
    expect(find.textContaining('Calibration, day 1 of 14'), findsOneWidget);
    expect(
      await io(tester, () => repos.targets.watchTargetsHistory().first),
      hasLength(1),
    );
    await shutDown(tester);
  });

  testWidgets('female onboarding offers female-only health questions', (
    tester,
  ) async {
    await pumpApp(tester);
    await tester.tap(find.text('Female'));
    await tester.tap(find.text('Choose date'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('onboarding-feet')), '5');
    await tester.enterText(
      find.byKey(const ValueKey('onboarding-inches')),
      '5',
    );
    await tester.enterText(
      find.byKey(const ValueKey('onboarding-weight')),
      '150',
    );
    await tester.pump();
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next')); // activity
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next')); // training
    await tester.pumpAndSettle();

    expect(find.text('Pregnant'), findsOneWidget);
    await tester.tap(find.text('Breastfeeding'));
    await tester.pump();
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    // Lactation locks the plan to maintenance: no deficit modes offered.
    expect(find.text('Maintenance'), findsOneWidget);
    expect(find.text('Fat loss'), findsNothing);
    expect(find.text('Recomp'), findsNothing);
    await shutDown(tester);
  });

  testWidgets('logging food updates the day against its targets', (
    tester,
  ) async {
    await seedSetup(tester);
    await pumpApp(tester);

    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('food-name')),
      'Chicken and rice',
    );
    await tester.enterText(find.byKey(const ValueKey('food-protein')), '45');
    await tester.enterText(find.byKey(const ValueKey('food-carbs')), '60');
    await tester.enterText(find.byKey(const ValueKey('food-fat')), '10');
    await tester.pump();
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();

    // 45*4 + 60*4 + 10*9 = 510 kcal, calculated from macros.
    final logged = await io(tester, () => repos.food.watchFood(today).first);
    expect(logged.single.kcal, 510);

    // Logging from the dashboard leaves the user on the dashboard; the log
    // itself is on the Food tab.
    expect(find.textContaining('kcal left'), findsOneWidget);
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    expect(find.text('Chicken and rice'), findsOneWidget);
    expect(find.text('510'), findsWidgets);
    expect(find.textContaining('kcal left'), findsOneWidget);

    await tester.tap(find.text('Complete'));
    await tester.pumpAndSettle();
    expect(
      await io(tester, () => repos.dayMarks.watchCompleteness(today).first),
      DayCompleteness.complete,
    );
    await shutDown(tester);
  });

  testWidgets('progress and coach tabs render from stored data', (
    tester,
  ) async {
    await seedSetup(tester, units: UnitSystem.metric);
    await tester.runAsync(() async {
      for (var d = 1; d <= 10; d++) {
        await repos.weights.saveWeight(today.addDays(-d), 90 + d * 0.1);
      }
    });
    await pumpApp(tester);

    await tester.tap(find.text('Progress'));
    await tester.pumpAndSettle();
    expect(find.text('Trend weight'), findsOneWidget);
    expect(find.textContaining('kg'), findsWidgets);

    await tester.enterText(
      find.byKey(const ValueKey('entry-weigh-in')),
      '89.5',
    );
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('save-weigh-in')));
    await tester.pumpAndSettle();
    final weights = await io(tester, () => repos.weights.watchWeights().first);
    expect(weights.last.weightKg, 89.5);

    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    expect(find.text('Goal: Fat loss'), findsOneWidget);
    expect(find.text('Daily targets'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.textContaining('before your first measurement'),
      300,
    );
    expect(
      find.textContaining('before your first measurement'),
      findsOneWidget,
    );
    await shutDown(tester);
  });
}
