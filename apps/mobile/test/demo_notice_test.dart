import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/ui/demo_notice.dart';
import 'package:martian_macros/src/theme/mm_colors.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';

void main() {
  for (final brightness in Brightness.values) {
    testWidgets(
      'MM-182: themed demo contrast outside Scaffold in $brightness',
      (tester) async {
        await tester.pumpWidget(
          MaterialApp(
            theme: mmTheme(brightness),
            builder: (context, child) => DemoNotice(child: child!),
            home: const Scaffold(body: Text('App content')),
          ),
        );
        final strip = find.ancestor(
          of: find.text('DEMO · Synthetic data'),
          matching: find.byType(ColoredBox),
        );
        expect(strip, findsOneWidget);
        final background = tester.widget<ColoredBox>(strip).color;
        final label = tester.widget<Text>(find.text('DEMO · Synthetic data'));
        final colors = brightness == Brightness.light
            ? MmColors.light
            : MmColors.dark;
        expect(background, colors.canvas);
        expect(label.style!.color, colors.text);
        final foregroundLuminance = label.style!.color!.computeLuminance();
        final backgroundLuminance = background.computeLuminance();
        final lighter = foregroundLuminance > backgroundLuminance
            ? foregroundLuminance
            : backgroundLuminance;
        final darker = foregroundLuminance < backgroundLuminance
            ? foregroundLuminance
            : backgroundLuminance;
        expect((lighter + 0.05) / (darker + 0.05), greaterThanOrEqualTo(4.5));
        expect(
          tester.getSize(strip).width,
          tester.getSize(find.byType(DemoNotice)).width,
        );
        expect(
          find.descendant(of: strip, matching: find.byType(SafeArea)),
          findsOneWidget,
        );
        expect(find.text('App content'), findsOneWidget);
      },
    );
  }

  testWidgets('synthetic identity stays visible above app content', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: mmTheme(Brightness.light),
        home: const DemoNotice(child: Text('Demo destination')),
      ),
    );
    expect(find.text('DEMO · Synthetic data'), findsOneWidget);
    expect(find.text('Demo destination'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
