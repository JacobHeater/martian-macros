import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-111 through the app.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() => repos = InMemoryRepositories());

  testWidgets('a 170 cm woman at 50 kg is offered maintenance and lean gain '
      'only, and told why', (tester) async {
    await pumpApp(tester, repos, FixedClock(today));
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
      '7',
    );
    await tester.enterText(
      find.byKey(const ValueKey('onboarding-weight')),
      '110',
    );
    await tester.pump();
    for (var i = 0; i < 4; i++) {
      // measurements, activity, training, health
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();
    }

    expect(find.text('Your plan'), findsOneWidget);
    expect(find.text('Maintenance'), findsOneWidget);
    expect(find.text('Lean gain'), findsOneWidget);
    expect(find.text('Fat loss'), findsNothing);
    expect(find.text('Recomp'), findsNothing);
    expect(
      find.textContaining('below the range where the app will plan a calorie'),
      findsOneWidget,
    );
  });

  testWidgets('in the caution zone the Coach screen carries a caution', (
    tester,
  ) async {
    // 180 cm and 63 kg is BMI 19.4.
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 63);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    expect(
      find.textContaining('close to the low end of the healthy range'),
      findsOneWidget,
    );
  });

  testWidgets('a deficit ends at the check-in when weight stays under BMI '
      '18.5, and the goal becomes maintenance', (tester) async {
    await repos.setup.saveSetup(
      typicalSetup(sex: BiologicalSex.female, onboardedOn: today.addDays(-60)),
    );
    // typicalSetup is 180 cm; BMI 18.3 at 180 cm is 59.3 kg.
    for (var d = 20; d >= 0; d--) {
      await repos.weights.saveWeight(today.addDays(-d), 59.3);
    }
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-30),
        mode: GoalMode.fatLoss,
        tdeeKcal: 2000,
        tdeeSigmaKcal: 250,
        tdeeStatus: TdeeStatus.updated,
        targets: const DailyTargets(
          kcal: 1500,
          proteinG: 110,
          fatG: 50,
          carbsG: 190,
          weeklyRateFraction: -0.0075,
        ),
      ),
    );
    await pumpApp(tester, repos, FixedClock(today));

    final history = await readNow(
      tester,
      () => repos.targets.watchTargetsHistory().first,
    );
    expect(history.length, 2);
    expect(history.last.mode, GoalMode.maintenance);
    expect(
      history.last.targets.flags,
      contains(TargetFlag.underweightMaintenance),
    );
    expect(
      history.last.targets.kcal - history.first.targets.kcal,
      greaterThan(100),
    );
    final setup = (await readNow(tester, repos.setup.loadSetup))!;
    expect(setup.goalMode, GoalMode.maintenance);
  });
}
