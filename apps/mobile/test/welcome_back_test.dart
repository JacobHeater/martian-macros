import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-147: coming back after a gap.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  Future<void> lastActive(int daysAgo) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-210))
          .copyWith(healthCheckConfirmedOn: () => today.addDays(-30)),
    );
    await repos.weights.saveWeight(today.addDays(-daysAgo), 82);
  }

  testWidgets('after three weeks away, one screen asks only for a weigh-in', (
    tester,
  ) async {
    await lastActive(22);
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Welcome back'), findsOneWidget);
    expect(
      find.text('To pick up, the coach needs one thing: a weigh-in.'),
      findsOneWidget,
    );
    expect(find.text('Dashboard'), findsNothing);
  });

  testWidgets('nothing says how long, or that anything ended', (tester) async {
    await lastActive(22);
    await pumpApp(tester, repos, FixedClock(today));
    final all = tester
        .widgetList<Text>(find.byType(Text))
        .map((t) => t.data ?? '')
        .join(' ')
        .toLowerCase();
    for (final word in [
      '21',
      '22',
      'days',
      'missed',
      'streak',
      'lost',
      'gap',
    ]) {
      expect(all, isNot(contains(word)), reason: word);
    }
  });

  testWidgets('a weigh-in opens the dashboard', (tester) async {
    await lastActive(22);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.enterText(
      find.byKey(const ValueKey('entry-welcome-back-weigh-in')),
      '181',
    );
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('save-welcome-back-weigh-in')));
    await tester.pumpAndSettle();
    expect(find.text('Welcome back'), findsNothing);
    expect(find.text('Dashboard'), findsOneWidget);
    final weights = await readNow(
      tester,
      () => repos.weights.watchWeights().first,
    );
    expect(weights.any((w) => w.date == today), isTrue);
  });

  testWidgets('Later opens the dashboard, which asks for a weigh-in as usual', (
    tester,
  ) async {
    await lastActive(22);
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.byKey(const ValueKey('welcome-back-later')));
    await tester.pumpAndSettle();
    expect(find.text('Welcome back'), findsNothing);
    expect(find.text('Today’s weigh-in'), findsOneWidget);
    // And it is not shown again the next day for the same absence.
    await pumpApp(tester, repos, FixedClock(today.addDays(1)));
    expect(find.text('Welcome back'), findsNothing);
  });

  testWidgets('six days away is not a gap', (tester) async {
    await lastActive(7);
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Welcome back'), findsNothing);
  });

  testWidgets('after a long gap the health check is asked again', (
    tester,
  ) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-300))
          .copyWith(healthCheckConfirmedOn: () => today.addDays(-125)),
    );
    await repos.weights.saveWeight(today.addDays(-121), 82);
    await pumpApp(tester, repos, FixedClock(today));
    expect(find.text('Welcome back'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('welcome-back-later')));
    await tester.pumpAndSettle();
    expect(find.text('Dashboard'), findsNothing);
    expect(find.byKey(const ValueKey('welcome-back-later')), findsNothing);
  });
}
