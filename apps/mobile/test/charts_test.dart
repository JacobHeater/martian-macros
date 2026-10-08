import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:martian_macros/src/progress/progress_screen.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);

  Future<void> pump(WidgetTester tester, int weighIns) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-30)));
    for (var d = weighIns - 1; d >= 0; d--) {
      await repos.weights.saveWeight(today.addDays(-d), 82 + d * 0.1);
    }
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.5;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          clockProvider.overrideWithValue(FixedClock(today)),
        ],
        child: MaterialApp(
          theme: mmTheme(Brightness.light),
          home: const Scaffold(body: ProgressScreen()),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('a single weigh-in says a trend needs more', (tester) async {
    await pump(tester, 1);
    expect(find.text('A trend needs more weigh-ins.'), findsOneWidget);
  });

  testWidgets('several weigh-ins do not show that sentence', (tester) async {
    await pump(tester, 8);
    expect(find.text('A trend needs more weigh-ins.'), findsNothing);
  });

  testWidgets('the chart has a caption a screen reader reads', (tester) async {
    final handle = tester.ensureSemantics();
    await pump(tester, 8);
    expect(
      find.bySemanticsLabel(RegExp(r'Weight trend over the last 30 days')),
      findsOneWidget,
    );
    handle.dispose();
  });
}
