import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-143: the app explains where its numbers come from.
void main() {
  final today = CalendarDate(2026, 10, 5);

  test('the shipped copy matches docs/evidence.md', () {
    expect(
      File('assets/evidence.md').readAsStringSync(),
      File('../../docs/evidence.md').readAsStringSync(),
      reason: 'Run "mm evidence" to refresh the app copy.',
    );
  });

  testWidgets(
    'a question shows its answer, the grade in words, then the source',
    (tester) async {
      final repos = InMemoryRepositories();
      await repos.setup.saveSetup(
        typicalSetup(onboardedOn: today.addDays(-60)),
      );
      await pumpApp(tester, repos, FixedClock(today));
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(find.text('How this works'), 300);
      await tester.tap(find.text('How this works'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('How are my calories set?'));
      await tester.pumpAndSettle();
      expect(find.text('The rules behind this'), findsOneWidget);
      expect(
        find.textContaining(
          RegExp(
            'Well established|Reasonably supported|Early evidence|Our judgement',
          ),
        ),
        findsWidgets,
      );
      expect(find.textContaining('Source:'), findsNothing);

      await tester.tap(find.byType(Card).first);
      await tester.pumpAndSettle();
      expect(find.textContaining('Source:'), findsOneWidget);
    },
  );
}
