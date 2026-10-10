import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-139: confidence is shown in words and the estimate is one tap away.
void main() {
  final today = CalendarDate(2026, 10, 5);

  testWidgets('Learning explains the target hold and what to do next', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today));
    await repos.weights.saveWeight(today, 82);
    await pumpApp(tester, repos, FixedClock(today));

    expect(find.text('Learning'), findsOneWidget);
    expect(
      find.text(
        'Calibration, day 1 of 14. Targets hold while the app learns your metabolism.',
      ),
      findsOneWidget,
    );

    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    // The metabolism card sits above the confidence card; the list builds
    // only what is near the screen, so each is checked where it is.
    await tester.scrollUntilVisible(find.textContaining('so far'), 300);
    expect(find.textContaining('About'), findsOneWidget);
    expect(find.textContaining('so far'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Coach confidence · Learning'),
      300,
    );
    expect(find.text('Coach confidence · Learning'), findsOneWidget);
    expect(
      find.text('Targets are held while the coach learns.'),
      findsOneWidget,
    );
    expect(
      find.textContaining('Log food and mark days complete'),
      findsOneWidget,
    );
    expect(find.textContaining('score'), findsNothing);

    final metabolismTitle = find.text('Your metabolism estimate');
    await tester.scrollUntilVisible(metabolismTitle, 300);
    await tester.ensureVisible(metabolismTitle);
    await tester.pumpAndSettle();
    await tester.tap(metabolismTitle);
    await tester.pumpAndSettle();
    expect(find.textContaining('Probably between'), findsOneWidget);
    expect(find.textContaining('±'), findsNothing);
  });
}
