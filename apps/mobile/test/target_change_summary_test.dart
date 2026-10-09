import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);
  final previousDay = today.addDays(-4);
  final changeDay = today.addDays(-1);

  TargetsRecord target({
    required CalendarDate effectiveFrom,
    required double kcal,
    double protein = 150,
    TargetsExplanation? explanation,
    bool summarySeen = true,
  }) => TargetsRecord(
    effectiveFrom: effectiveFrom,
    mode: GoalMode.fatLoss,
    tdeeKcal: 2500,
    tdeeSigmaKcal: 180,
    tdeeStatus: TdeeStatus.updated,
    explanation: explanation,
    summarySeen: summarySeen,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: protein,
      proteinMinimumG: 120,
      fatG: 65,
      carbsG: 180,
      weeklyRateFraction: -0.0075,
    ),
  );

  testWidgets('a macro-only target change is shown on the next app opening', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        onboardedOn: today.addDays(-30),
        healthCheckConfirmedOn: today.addDays(-30),
      ),
    );
    await repos.weights.saveWeight(today, 82);
    await repos.targets.saveTargets(
      target(effectiveFrom: previousDay, kcal: 2200),
    );
    await repos.targets.saveTargets(
      target(
        effectiveFrom: changeDay,
        kcal: 2200,
        protein: 160,
        summarySeen: false,
        explanation: const TargetsExplanation(
          lines: [],
          previousKcal: 2200,
          newKcal: 2200,
          estimateStatus: TdeeStatus.updated,
        ),
      ),
    );

    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Why your targets are what they are'), findsOneWidget);
    expect(find.textContaining('Protein target 150 → 160 g'), findsOneWidget);
  });

  testWidgets('an unseen target change is shown once and remains in history', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        onboardedOn: today.addDays(-30),
        healthCheckConfirmedOn: today.addDays(-30),
      ),
    );
    await repos.weights.saveWeight(today, 82);
    await repos.targets.saveTargets(
      target(effectiveFrom: previousDay, kcal: 2200),
    );
    await repos.targets.saveTargets(
      target(
        effectiveFrom: changeDay,
        kcal: 2150,
        summarySeen: false,
        explanation: const TargetsExplanation(
          lines: [ExplanationLine(ExplanationReason.stepLimit, -50)],
          previousKcal: 2200,
          newKcal: 2150,
          estimateStatus: TdeeStatus.updated,
          usableIntakeDays: 20,
          weighIns: 20,
        ),
      ),
    );

    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Why your targets are what they are'), findsOneWidget);
    expect(find.textContaining('Weekly changes are limited'), findsOneWidget);
    var saved = (await tester.runAsync(
      () => repos.targets.watchTargetsHistory().first,
    ))!;
    expect(saved.last.summarySeen, isFalse);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
    saved = (await tester.runAsync(
      () => repos.targets.watchTargetsHistory().first,
    ))!;
    expect(saved.last.summarySeen, isFalse);

    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Why your targets are what they are'), findsOneWidget);
    Navigator.of(
      tester.element(find.text('Why your targets are what they are')),
    ).pop();
    await tester.pumpAndSettle();
    saved = (await tester.runAsync(
      () => repos.targets.watchTargetsHistory().first,
    ))!;
    expect(saved.last.summarySeen, isTrue);
    expect(saved.last.explanation?.lines, hasLength(1));

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Why your targets are what they are'), findsNothing);

    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();
    expect(find.text('Target history'), findsOneWidget);
    await tester.tap(find.byType(ListTile).first);
    await tester.pumpAndSettle();
    expect(find.text('Why your targets are what they are'), findsOneWidget);
  });
}
