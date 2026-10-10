import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/format/fmt.dart';
import 'package:martian_macros/src/format/stall_text.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-140: what the coach says about a stall.
void main() {
  const fmt = Fmt(UnitSystem.metric);

  StallAssessment stall(
    StallDiagnosis diagnosis, {
    bool gaining = false,
    double? intake = 2100,
    double? target = 2100,
    double? waist,
    bool event = false,
    double? change,
    bool atFloor = false,
    bool low = false,
  }) => StallAssessment(
    status: StallStatus.stalled,
    windowDays: 21,
    diagnosis: diagnosis,
    gaining: gaining,
    usableFoodDays: 7,
    weighIns: 12,
    averageIntakeKcal: intake,
    averageTargetKcal: target,
    waistChangeCm: waist,
    maskedByEvent: event,
    expectedChangeKcal: change,
    atFloor: atFloor,
    estimateLow: low,
  );

  final every = [
    stall(StallDiagnosis.data),
    stall(StallDiagnosis.masked, waist: -2),
    stall(StallDiagnosis.masked, event: true),
    stall(StallDiagnosis.intake, intake: 2350),
    stall(StallDiagnosis.intake, intake: 1850, gaining: true),
    stall(StallDiagnosis.estimate, change: -100),
    stall(StallDiagnosis.estimate),
    stall(StallDiagnosis.estimate, atFloor: true),
    stall(StallDiagnosis.estimate, change: -100, low: true),
    stall(StallDiagnosis.estimate, change: 100, gaining: true),
  ];

  test('thin data says what would help', () {
    final (body, options) = stallText(stall(StallDiagnosis.data), fmt);
    expect(body, contains('7 fully logged days and 12 weigh-ins'));
    expect(body, contains('12 logged days and 10 weigh-ins'));
    expect(options, isEmpty);
  });

  test('masked states the waist and changes nothing', () {
    final (body, _) = stallText(stall(StallDiagnosis.masked, waist: -2), fmt);
    expect(
      body,
      'Your waist is down 2.0 cm while the scale held. That is usually fat '
      'loss hidden by water. Nothing to change.',
    );
  });

  test('intake states both figures and offers options', () {
    final (body, options) = stallText(
      stall(StallDiagnosis.intake, intake: 2350),
      fmt,
    );
    expect(body, contains('about 2,350 against a target of 2,100'));
    expect(body, contains('At 2,350 the app would expect roughly the pace'));
    expect(options, hasLength(2));
    expect(options.first, 'Keep the target');
  });

  test('the estimate diagnosis gives the size of the coming change', () {
    final (body, options) = stallText(
      stall(StallDiagnosis.estimate, change: -100),
      fmt,
    );
    expect(body, contains('lower than estimated'));
    expect(body, contains('comes down by about 100 at the next check-in'));
    expect(options, isEmpty);
  });

  test('at the floor it offers a break or walking, not a reduction', () {
    final (body, options) = stallText(
      stall(StallDiagnosis.estimate, atFloor: true),
      fmt,
    );
    expect(body, contains('will not come down'));
    expect(body, isNot(contains('comes down by')));
    expect(options, [
      'Take a break at maintenance for a week or two',
      'Add some daily walking',
    ]);
  });

  test('missing food is raised only when the estimate is very low', () {
    final low = stallText(
      stall(StallDiagnosis.estimate, change: -100, low: true),
      fmt,
    ).$1;
    expect(low, contains('oils, drinks, sauces, tastes while cooking'));
    for (final a in every.where((a) => !a.estimateLow)) {
      expect(stallText(a, fmt).$1, isNot(contains('into the log')));
    }
  });

  test('no diagnosis accuses, moralizes or instructs', () {
    for (final a in every) {
      final (body, options) = stallText(a, fmt);
      final all = '$body ${options.join(' ')}'.toLowerCase();
      for (final word in [
        'cheat',
        'slip',
        'honest',
        'accurate',
        'good',
        'bad',
        'fail',
        'should',
        'must',
        'burn',
        'exercise',
        'plateau',
      ]) {
        expect(all, isNot(contains(word)), reason: '$word in "$all"');
      }
    }
  });

  testWidgets('a flat month on target shows the card on the Coach screen', (
    tester,
  ) async {
    final today = CalendarDate(2026, 10, 5);
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-70)));
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-60),
        mode: GoalMode.fatLoss,
        tdeeKcal: 2700,
        tdeeSigmaKcal: 150,
        tdeeStatus: TdeeStatus.updated,
        targets: const DailyTargets(
          kcal: 2100,
          proteinG: 160,
          proteinMinimumG: 130,
          fatG: 70,
          carbsG: 220,
          weeklyRateFraction: -0.0075,
        ),
      ),
    );
    for (var i = 0; i <= 50; i++) {
      final day = today.addDays(-i);
      await repos.weights.saveWeight(day, 82);
      if (i == 0) continue;
      await repos.food.addFood(
        FoodEntry(
          id: 0,
          date: day,
          meal: Meal.dinner,
          name: 'Food',
          kcal: 2100,
          proteinG: 150,
          carbsG: 220,
          fatG: 70,
          source: QuantitySource.weighed,
        ),
      );
      await repos.dayMarks.setCompleteness(day, DayCompleteness.complete);
    }
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    final card = find.byKey(const ValueKey('stall-card'));
    await tester.scrollUntilVisible(card, 300);
    expect(
      find.descendant(
        of: card,
        matching: find.textContaining('your weight has held'),
      ),
      findsOneWidget,
    );
  });
}
