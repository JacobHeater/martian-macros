import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/ui/demo_notice.dart';

void main() {
  testWidgets('synthetic identity stays visible above app content', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(home: DemoNotice(child: Text('Demo destination'))),
    );
    expect(find.text('DEMO · Synthetic data'), findsOneWidget);
    expect(find.text('Demo destination'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
