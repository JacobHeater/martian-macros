import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food/food_screen.dart';

/// Scrolls the Food screen until [finder] is built and on screen.
///
/// The Food screen is a lazy list: what sits below the calorie hero is not
/// built until it is near the screen, and where that falls differs between
/// machines (the screenshot machine's fonts are taller than a laptop's).
/// Tests that look for a logged entry reveal it first.
Future<void> revealOnFoodScreen(WidgetTester tester, Finder finder) async {
  await tester.dragUntilVisible(
    finder,
    find.descendant(
      of: find.byType(FoodScreen),
      matching: find.byType(Scrollable),
    ),
    const Offset(0, -150),
  );
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
}
