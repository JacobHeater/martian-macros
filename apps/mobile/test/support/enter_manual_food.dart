import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> enterManualFood(WidgetTester tester) async {
  final action = find.byKey(const ValueKey('food-enter-manually'));
  await tester.ensureVisible(action);
  await tester.tap(action);
  await tester.pumpAndSettle();
}
