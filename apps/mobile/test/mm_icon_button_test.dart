import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/theme/mm_colors.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:martian_macros/src/ui/mm_icon_button.dart';
import 'package:martian_macros/src/ui/mm_icon_button_kind.dart';
import 'package:martian_macros/src/ui/mm_stroke_icon.dart';
import 'package:martian_macros/src/ui/mm_stroke_icon_painter.dart';

void main() {
  for (final brightness in Brightness.values) {
    testWidgets(
      'Add uses vector geometry and clear hover styling ($brightness)',
      (tester) async {
        await tester.pumpWidget(
          MaterialApp(
            theme: mmTheme(brightness),
            home: Scaffold(
              body: Center(
                child: MmIconButton(
                  icon: Icons.add,
                  tooltip: 'Add food to lunch',
                  kind: MmIconButtonKind.add,
                  onPressed: () {},
                ),
              ),
            ),
          ),
        );
        final colors = brightness == Brightness.dark
            ? MmColors.dark
            : MmColors.light;
        final button = find.byType(IconButton);
        final decoration = find.descendant(
          of: button,
          matching: find.byType(AnimatedContainer),
        );
        BoxDecoration background() =>
            tester.widget<AnimatedContainer>(decoration).decoration!
                as BoxDecoration;
        expect(tester.getSize(decoration), const Size(28, 28));
        expect(background().borderRadius, BorderRadius.circular(8));
        expect(background().color, colors.ember.withValues(alpha: 0.15));
        expect(tester.getSize(find.byType(MmStrokeIcon)), const Size(16, 16));
        expect(tester.getSize(button).width, greaterThanOrEqualTo(48));
        expect(find.byIcon(Icons.add), findsNothing);
        final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
        await mouse.addPointer(location: Offset.zero);
        await mouse.moveTo(tester.getCenter(button));
        await tester.pumpAndSettle();
        expect(background().color, colors.ember);
        final paint =
            tester
                    .widget<CustomPaint>(
                      find.descendant(
                        of: find.byType(MmStrokeIcon),
                        matching: find.byType(CustomPaint),
                      ),
                    )
                    .painter!
                as MmStrokeIconPainter;
        expect(paint.color, colors.onEmber);
        await mouse.removePointer();
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      },
    );
  }
}
