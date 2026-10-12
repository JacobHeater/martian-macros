import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-216: MM-167 says that changing how a food was measured clears the
/// amount "and the form says so". The amount is cleared and nothing is said.
void main() {
  final today = CalendarDate(2026, 10, 5);

  testWidgets(
    'changing the method says the amount has to be entered again',
    (tester) async {
      final repos = InMemoryRepositories();
      await repos.setup.saveSetup(
        typicalSetup(onboardedOn: today.addDays(-40)),
      );
      await repos.weights.saveWeight(today, 82);
      await pumpApp(tester, repos, FixedClock(today));
      await tester.tap(find.text('Food'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Add food'));
      await tester.pumpAndSettle();

      // The sheet opens on Label serving with one serving.
      await tester.ensureVisible(find.text('Weighed'));
      await tester.tap(find.text('Weighed'));
      await tester.pumpAndSettle();

      expect(find.textContaining('Enter how much again'), findsOneWidget);
    },
    // Fails today: no such line is shown. Enable with the fix (MM-216).
    skip: true,
  );
}
