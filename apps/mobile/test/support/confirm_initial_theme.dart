import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Keeps existing onboarding tests on the real new-install startup path.
Future<void> confirmInitialTheme(WidgetTester tester) async {
  final button = find.byKey(const ValueKey('theme-continue'));
  await tester.scrollUntilVisible(button, 300);
  await tester.ensureVisible(button);
  await tester.pumpAndSettle();
  await tester.tap(button);
  await tester.pumpAndSettle();
}
