import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-148: pausing for a holiday, an illness or an injury.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  Future<void> seed({int lastWeighInDaysAgo = 0}) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-200))
          .copyWith(healthCheckConfirmedOn: () => today.addDays(-30)),
    );
    await repos.weights.saveWeight(today.addDays(-lastWeighInDaysAgo), 82);
  }

  Pause pause(
    int from,
    int to, {
    PauseReason reason = PauseReason.travel,
    bool extended = false,
  }) => Pause(
    from: today.addDays(from),
    to: today.addDays(to),
    reason: reason,
    extended: extended,
  );

  Future<void> eat(double kcal) => repos.food.addFood(
    FoodEntry(
      id: 0,
      date: today,
      meal: Meal.dinner,
      name: 'Wedding dinner',
      kcal: kcal,
      proteinG: 120,
      carbsG: 380,
      fatG: 140,
      source: QuantitySource.weighed,
    ),
  );

  Future<void> openPause(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('settings-pause')),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(find.byKey(const ValueKey('settings-pause')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('settings-pause')));
    await tester.pumpAndSettle();
  }

  Future<List<Pause>> pauses(WidgetTester tester) =>
      readNow(tester, () => repos.pauses.watchPauses().first);

  String shown(WidgetTester tester) => tester
      .widgetList<Text>(find.byType(Text))
      .map((t) => t.data ?? '')
      .join(' ')
      .toLowerCase();

  testWidgets('a paused day is never called over', (tester) async {
    await seed();
    await repos.pauses.savePause(pause(-2, 5));
    await eat(3400);
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.textContaining('paused, guide'), findsOneWidget);
    expect(find.textContaining('Paused until'), findsOneWidget);
    expect(shown(tester), isNot(contains('over')));
    expect(find.text('3,400'), findsOneWidget);
  });

  testWidgets('the same day without a pause is over', (tester) async {
    await seed();
    await eat(3400);
    await pumpApp(tester, repos, FixedClock(today));
    expect(shown(tester), contains('kcal over'));
  });

  testWidgets('a pause is set from Settings, starting today', (tester) async {
    await seed();
    await openPause(tester);
    await tester.tap(find.byKey(const ValueKey('pause-start')));
    await tester.pumpAndSettle();
    final saved = (await pauses(tester)).single;
    expect(saved.from, today);
    expect(saved.days, 7);
    expect(saved.reason, PauseReason.travel);
    expect(find.byKey(const ValueKey('pause-current')), findsOneWidget);
    final events = await readNow(
      tester,
      () => repos.weightEvents.watchWeightEvents().first,
    );
    expect(events, isEmpty, reason: 'travel records no weight event');
  });

  testWidgets('an illness pause records a weight event for its days', (
    tester,
  ) async {
    await seed();
    await openPause(tester);
    await tester.tap(find.text('Illness'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('pause-start')));
    await tester.pumpAndSettle();
    final events = await readNow(
      tester,
      () => repos.weightEvents.watchWeightEvents().first,
    );
    expect(events.single.date, today);
    expect(events.single.type, WeightEventType.illness);
  });

  testWidgets('a pause can be extended once', (tester) async {
    await seed();
    await repos.pauses.savePause(pause(-2, 5));
    await openPause(tester);
    await tester.tap(find.byKey(const ValueKey('pause-extend')));
    await tester.pumpAndSettle();
    final extended = (await pauses(tester)).single;
    expect(extended.to, today.addDays(12));
    expect(extended.extended, isTrue);
    await tester.tap(find.byKey(const ValueKey('pause-extend')));
    await tester.pumpAndSettle();
    expect((await pauses(tester)).single.to, today.addDays(12));
  });

  testWidgets('resuming early asks for a weigh-in and nothing else', (
    tester,
  ) async {
    await seed(lastWeighInDaysAgo: 4);
    await repos.pauses.savePause(pause(-3, 5));
    await openPause(tester);
    await tester.tap(find.byKey(const ValueKey('pause-end')));
    await tester.pumpAndSettle();
    expect((await pauses(tester)).single.to, today.addDays(-1));
    expect(find.text('Ready to resume?'), findsOneWidget);
    expect(find.text('Dashboard'), findsNothing);
  });

  testWidgets('the resume screen has no word for absence', (tester) async {
    await seed(lastWeighInDaysAgo: 12);
    await repos.pauses.savePause(pause(-11, -1));
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Ready to resume?'), findsOneWidget);
    final all = shown(tester);
    for (final word in ['back', 'away', 'missed', 'streak', 'gap', 'lost']) {
      expect(all, isNot(contains(word)), reason: word);
    }
  });

  testWidgets('a weigh-in after a pause opens the dashboard', (tester) async {
    await seed(lastWeighInDaysAgo: 12);
    await repos.pauses.savePause(pause(-11, -1));
    await pumpApp(tester, repos, FixedClock(today));
    await tester.enterText(
      find.byKey(const ValueKey('entry-welcome-back-weigh-in')),
      '181',
    );
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('save-welcome-back-weigh-in')));
    await tester.pumpAndSettle();
    expect(find.text('Ready to resume?'), findsNothing);
    expect(find.text('Dashboard'), findsOneWidget);
  });

  testWidgets('Later puts the resume screen away', (tester) async {
    await seed(lastWeighInDaysAgo: 12);
    await repos.pauses.savePause(pause(-11, -1));
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.byKey(const ValueKey('welcome-back-later')));
    await tester.pumpAndSettle();
    expect(find.text('Ready to resume?'), findsNothing);
    expect(find.text('Dashboard'), findsOneWidget);
  });

  testWidgets('days with nothing recorded in a pause are not a lapse', (
    tester,
  ) async {
    await seed(lastWeighInDaysAgo: 12);
    await repos.pauses.savePause(pause(-11, 3));
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Welcome back'), findsNothing);
    expect(find.text('Ready to resume?'), findsNothing);
    expect(find.text('Dashboard'), findsOneWidget);
  });

  testWidgets('the Coach screen says it is paused and offers the way out', (
    tester,
  ) async {
    await seed();
    await repos.pauses.savePause(pause(-2, 5));
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('pause-banner')), findsOneWidget);
    expect(find.byKey(const ValueKey('pause-banner-manage')), findsOneWidget);
  });

  testWidgets('many paused days prompt one neutral question', (tester) async {
    await seed();
    await repos.pauses.savePause(pause(-100, -73));
    await repos.pauses.savePause(pause(-60, -33));
    await repos.weights.saveWeight(today.addDays(-1), 82);
    await openPause(tester);
    expect(find.byKey(const ValueKey('pause-heavy-use')), findsOneWidget);
    // It is a question, not a refusal: the pause can still be set.
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('pause-start')),
      200,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.tap(find.byKey(const ValueKey('pause-start')));
    await tester.pumpAndSettle();
    expect(await pauses(tester), hasLength(3));
  });

  testWidgets('a first pause prompts nothing', (tester) async {
    await seed();
    await openPause(tester);
    expect(find.byKey(const ValueKey('pause-heavy-use')), findsNothing);
  });
}
