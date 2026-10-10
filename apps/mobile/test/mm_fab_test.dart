import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:martian_macros/src/ui/mm_fab.dart';

void main() {
  for (final brightness in Brightness.values) {
    testWidgets('primary action has no glow or elevation ($brightness)', (
      tester,
    ) async {
      var pressed = false;
      await tester.pumpWidget(
        MaterialApp(
          theme: mmTheme(brightness),
          home: Scaffold(
            floatingActionButton: MmFab(
              label: 'Add food',
              icon: Icons.add,
              onPressed: () => pressed = true,
            ),
          ),
        ),
      );
      final fab = find.byType(MmFab);
      final button = tester.widget<FloatingActionButton>(
        find.descendant(of: fab, matching: find.byType(FloatingActionButton)),
      );
      expect(button.elevation, 0);
      expect(button.hoverElevation, 0);
      expect(button.focusElevation, 0);
      expect(button.highlightElevation, 0);
      final decorations = tester.widgetList<DecoratedBox>(
        find.descendant(of: fab, matching: find.byType(DecoratedBox)),
      );
      for (final decoration in decorations) {
        if (decoration.decoration case final BoxDecoration box) {
          expect(box.boxShadow ?? [], isEmpty);
        }
      }
      await tester.tap(find.text('Add food'));
      await tester.pumpAndSettle();
      expect(pressed, isTrue);
    });
  }
}
