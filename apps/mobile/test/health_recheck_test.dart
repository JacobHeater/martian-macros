import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);

  testWidgets('entering a deficit confirms health answers before saving goal', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        goalMode: GoalMode.maintenance,
        onboardedOn: today.addDays(-10),
      ),
    );
    await repos.weights.saveWeight(today, 80);
    await pumpApp(tester, repos, FixedClock(today));

    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Change'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(find.text('Change'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Change'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Fat loss'));
    await tester.pumpAndSettle();

    expect(find.text('Confirm answers'), findsOneWidget);
    expect(
      (await tester.runAsync(repos.setup.loadSetup))!.goalMode,
      GoalMode.maintenance,
    );

    await tester.tap(find.text('Confirm answers'));
    await tester.pumpAndSettle();
    final saved = (await tester.runAsync(repos.setup.loadSetup))!;
    expect(saved.goalMode, GoalMode.fatLoss);
    expect(saved.healthCheckConfirmedOn, today);
  });

  testWidgets('reporting pregnancy immediately moves the goal to maintenance', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        sex: BiologicalSex.female,
        onboardedOn: today.addDays(-100),
        healthCheckConfirmedOn: today.addDays(-100),
      ),
    );
    await pumpApp(tester, repos, FixedClock(today));

    expect(
      tester.getTopLeft(find.text('Pregnant')).dy,
      lessThan(
        tester.getTopLeft(find.text('History of an eating disorder')).dy,
      ),
    );
    await tester.tap(find.text('Pregnant'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Confirm answers'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Confirm answers'));
    await tester.pumpAndSettle();

    final saved = (await tester.runAsync(repos.setup.loadSetup))!;
    expect(saved.screening.pregnant, isTrue);
    expect(saved.goalMode, GoalMode.maintenance);
    expect(saved.profileRevision, 1);
  });

  testWidgets('male profiles do not see pregnancy or breastfeeding questions', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        onboardedOn: today.addDays(-100),
        healthCheckConfirmedOn: today.addDays(-100),
      ),
    );
    await pumpApp(tester, repos, FixedClock(today));

    expect(find.text('Pregnant'), findsNothing);
    expect(find.text('Breastfeeding'), findsNothing);
    expect(find.text('History of an eating disorder'), findsOneWidget);
  });

  testWidgets('bariatric surgery suppresses targets but keeps logging and '
      'measurements available', (tester) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        screening: const ScreeningAnswers(bariatricSurgery: true),
        onboardedOn: today,
      ),
    );
    await repos.weights.saveWeight(today, 80);
    await pumpApp(tester, repos, FixedClock(today));

    expect(
      await tester.runAsync(() => repos.targets.watchTargetsHistory().first),
      isEmpty,
    );
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('food-name')), 'Lunch');
    await tester.enterText(find.byKey(const ValueKey('food-protein')), '30');
    await tester.enterText(find.byKey(const ValueKey('food-carbs')), '40');
    await tester.enterText(find.byKey(const ValueKey('food-fat')), '15');
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    expect(
      await tester.runAsync(() => repos.food.watchFood(today).first),
      hasLength(1),
    );

    await tester.tap(find.text('Progress'));
    await tester.pumpAndSettle();
    expect(find.text('Trend weight'), findsOneWidget);
    expect(find.byKey(const ValueKey('entry-weigh-in')), findsOneWidget);
  });

  testWidgets('Coach shows insulin and weight-affecting medication cautions', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        screening: const ScreeningAnswers(
          insulinOrSulfonylurea: true,
          weightAffectingMedication: true,
        ),
        onboardedOn: today,
      ),
    );
    await repos.weights.saveWeight(today, 80);
    await pumpApp(tester, repos, FixedClock(today));

    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    expect(
      find.textContaining('limits loss to the gentlest pace'),
      findsOneWidget,
    );
    expect(
      find.textContaining(
        'Some medications can change weight or water retention',
      ),
      findsOneWidget,
    );
  });

  testWidgets('two skips defer to the next launch then pause deficits', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        onboardedOn: today.addDays(-100),
        healthCheckConfirmedOn: today.addDays(-100),
      ),
    );
    final clock = FixedClock(today);

    await pumpApp(tester, repos, clock);
    expect(
      find.textContaining('Has anything changed since your last health check?'),
      findsOneWidget,
    );
    await tester.tap(find.text('Not now'));
    await tester.pumpAndSettle();
    expect(find.text('Dashboard'), findsOneWidget);

    await tester.pumpWidget(const SizedBox());
    await tester.pump();
    await pumpApp(tester, repos, clock);
    expect(find.text('Skip again and pause deficit coaching'), findsOneWidget);
    await tester.tap(find.text('Skip again and pause deficit coaching'));
    await tester.pumpAndSettle();

    final paused = (await tester.runAsync(repos.setup.loadSetup))!;
    expect(paused.goalMode, GoalMode.maintenance);
    expect(paused.healthCheckSkipCount, 2);
    expect(find.text('Dashboard'), findsOneWidget);

    await tester.pumpWidget(const SizedBox());
    await tester.pump();
    await pumpApp(tester, repos, clock);
    expect(find.text('Confirm answers'), findsOneWidget);
    expect(find.text('Not now'), findsNothing);
    await tester.tap(find.text('Confirm answers'));
    await tester.pumpAndSettle();

    final confirmed = (await tester.runAsync(repos.setup.loadSetup))!;
    expect(confirmed.healthCheckConfirmedOn, today);
    expect(confirmed.healthCheckSkipCount, 0);
    expect(confirmed.healthCheckDueOn(today), isFalse);
    expect(
      find.textContaining('Has anything changed since your last health check?'),
      findsNothing,
    );
  });
}
