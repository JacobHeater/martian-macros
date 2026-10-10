import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/format/adherence_lines.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-149: the week described as facts, never scored.
void main() {
  final today = CalendarDate(2026, 10, 5);

  AdherenceSummary summary({
    int logged = 6,
    int complete = 5,
    double? intake = 2180,
    double? target = 2100,
    IntakeStanding? standing = IntakeStanding.onTarget,
    int? protein = 4,
    bool estimated = false,
  }) => AdherenceSummary(
    from: today.addDays(-7),
    to: today.addDays(-1),
    daysLogged: logged,
    completeDays: complete,
    weighIns: 6,
    averageIntakeKcal: intake,
    averageTargetKcal: target,
    standing: standing,
    proteinDays: protein,
    mostlyEstimated: estimated,
  );

  String intakeLine(AdherenceSummary s) => adherenceLines(
    s,
    floorKcal: 1500,
  ).firstWhere((l) => l.$1 == 'Average intake').$2;

  test('a typical week states each fact', () {
    final lines = adherenceLines(summary(), floorKcal: 1500);
    expect(lines, [
      ('Days logged', '6, 5 complete'),
      ('Weigh-ins', '6'),
      ('Average intake', '2,180 kcal against 2,100: on target'),
      ('Protein minimum met', '4 of 5 days'),
    ]);
  });

  test('over and under read the same apart from the direction', () {
    final over = intakeLine(
      summary(intake: 2350, standing: IntakeStanding.above),
    );
    final under = intakeLine(
      summary(intake: 1850, standing: IntakeStanding.below),
    );
    expect(over, '2,350 kcal against 2,100: 250 over');
    expect(under, '1,850 kcal against 2,100: 250 under');
  });

  test('below the floor is never on target or under target', () {
    final line = intakeLine(
      summary(intake: 1050, target: 1900, standing: IntakeStanding.belowFloor),
    );
    expect(line, contains("below the app's minimum of 1,500"));
    expect(line, isNot(contains('on target')));
    expect(line, isNot(contains('under')));
  });

  test('few days and estimates are said', () {
    expect(intakeLine(summary(complete: 2)), endsWith('rests on 2 days'));
    expect(intakeLine(summary(estimated: true)), endsWith('mostly estimated'));
  });

  test('no percentage, grade or score anywhere', () {
    for (final s in [
      summary(),
      summary(intake: 2350, standing: IntakeStanding.above),
      summary(logged: 0, complete: 0, intake: null, standing: null),
    ]) {
      final all = adherenceLines(
        s,
        floorKcal: 1500,
      ).map((l) => '${l.$1} ${l.$2}').join(' ').toLowerCase();
      for (final word in [
        '%',
        'score',
        'grade',
        'adherence',
        'great',
        'good',
      ]) {
        expect(all, isNot(contains(word)), reason: word);
      }
    }
  });

  testWidgets('the Coach screen shows the card from stored days', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    for (var i = 1; i <= 7; i++) {
      final day = today.addDays(-i);
      await repos.weights.saveWeight(day, 82);
      if (i <= 5) {
        await repos.food.addFood(
          FoodEntry(
            id: 0,
            date: day,
            meal: Meal.dinner,
            name: 'Dinner',
            kcal: 2100,
            proteinG: 150,
            carbsG: 220,
            fatG: 70,
            source: QuantitySource.weighed,
          ),
        );
        await repos.dayMarks.setCompleteness(day, DayCompleteness.complete);
      }
    }
    await repos.weights.saveWeight(today, 82);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    final card = find.byKey(const ValueKey('adherence-card'));
    await tester.scrollUntilVisible(card, 300);
    expect(
      find.descendant(of: card, matching: find.text('5, all complete')),
      findsOneWidget,
    );
    expect(find.descendant(of: card, matching: find.text('7')), findsOneWidget);
    expect(
      find.descendant(of: card, matching: find.textContaining('2,100 kcal')),
      findsOneWidget,
    );
  });
}
