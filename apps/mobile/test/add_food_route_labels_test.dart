import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-213: on a 360-wide phone the Saved and Estimate buttons at the top of
/// the Add food sheet break their one-word labels across two lines
/// ("Save/d", "Esti/mate"). Each label is a single word and must stay whole.
void main() {
  final today = CalendarDate(2026, 10, 5);

  testWidgets(
    'the three ways in at the top of Add food keep their labels on one line',
    (tester) async {
      final repos = InMemoryRepositories();
      await repos.setup.saveSetup(
        typicalSetup(onboardedOn: today.addDays(-40)),
      );
      await repos.weights.saveWeight(today, 82);
      tester.view.physicalSize = const Size(720, 1600);
      tester.view.devicePixelRatio = 2;
      addTearDown(tester.view.reset);
      await pumpApp(tester, repos, FixedClock(today));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Food'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Add food'));
      await tester.pumpAndSettle();

      double heightOf(String key) => tester
          .getSize(
            find.descendant(
              of: find.byKey(ValueKey(key)),
              matching: find.byType(Text),
            ),
          )
          .height;

      // Scan fits on one line; the other two are as tall only if they do too.
      final oneLine = heightOf('food-scan');
      expect(heightOf('food-my-foods'), oneLine, reason: 'Saved');
      expect(heightOf('food-estimate'), oneLine, reason: 'Estimate');
    },
    // Fails today: both labels wrap. Enable with the fix (MM-213).
    skip: true,
  );
}
