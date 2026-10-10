import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/charts/macro_split_chart.dart';
import 'package:martian_macros/src/food/meal_section.dart';
import 'package:martian_macros/src/food/add_food_sheet.dart';
import 'package:martian_macros/src/food/selected_day_provider.dart';
import 'package:martian_macros/src/ui/mm_surface.dart';
import 'package:martian_macros/src/ui/mm_icon_button.dart';
import 'package:martian_macros/src/ui/mm_icon_button_kind.dart';
import 'package:martian_macros/src/theme/mm_colors_context.dart';
import 'package:martian_macros/src/ui/mm_stroke_icon.dart';
import 'package:martian_macros/src/ui/mm_stroke_icon_kind.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

void main() {
  final today = CalendarDate(2026, 10, 10);
  late InMemoryRepositories repos;
  setUp(() => repos = InMemoryRepositories());

  Future<void> openFood(WidgetTester tester, {bool populated = false}) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-60)));
    await repos.weights.saveWeight(today, 82);
    if (populated) {
      for (final meal in Meal.values) {
        await repos.food.addFood(
          FoodEntry(
            id: 0,
            date: today,
            meal: meal,
            name: 'Food for ${meal.name}',
            kcal: 500,
            proteinG: 30,
            carbsG: 60,
            fatG: 16,
            source: QuantitySource.weighed,
          ),
        );
      }
    }
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food').last);
    await tester.pumpAndSettle();
  }

  testWidgets(
    'each empty meal has a separate card and accessible add control',
    (tester) async {
      await openFood(tester);
      for (final meal in Meal.values) {
        final card = find.byKey(ValueKey('meal-card-${meal.name}'));
        await tester.scrollUntilVisible(card, 250);
        expect(tester.widget(card), isA<MmSurface>());
        expect(
          find.descendant(of: card, matching: find.byType(MealSection)),
          findsOneWidget,
        );
      }
      expect(find.byType(MacroSplitChart), findsOneWidget);
    },
  );

  testWidgets('meals expand independently and retain add controls', (
    tester,
  ) async {
    await openFood(tester, populated: true);
    final lunch = find.byKey(const ValueKey('meal-card-lunch'));
    await tester.scrollUntilVisible(lunch, 250);
    final lunchFood = find.text('Food for lunch');
    await tester.ensureVisible(lunchFood);
    expect(lunchFood, findsOneWidget);
    final lunchHeader = find.descendant(
      of: lunch,
      matching: find.text('Lunch'),
    );
    await tester.tap(lunchHeader);
    await tester.pumpAndSettle();
    expect(lunchFood, findsNothing);
    expect(
      find.descendant(of: lunch, matching: find.byTooltip('Add food to lunch')),
      findsOneWidget,
    );
    final breakfast = find.byKey(const ValueKey('meal-card-breakfast'));
    await tester.ensureVisible(breakfast);
    expect(find.text('Food for breakfast'), findsOneWidget);
    await tester.ensureVisible(lunch);
    await tester.tap(lunchHeader);
    await tester.pumpAndSettle();
    expect(lunchFood, findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Food pie follows selected day; Dashboard remains on today', (
    tester,
  ) async {
    await openFood(tester, populated: true);
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today.addDays(-1),
        meal: Meal.lunch,
        name: 'Yesterday only',
        kcal: 200,
        proteinG: 10,
        carbsG: 20,
        fatG: 5,
        source: QuantitySource.weighed,
      ),
    );
    final container = ProviderScope.containerOf(
      tester.element(find.byType(MacroSplitChart)),
    );
    container.read(selectedDayProvider.notifier).set(today.addDays(-1));
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<MacroSplitChart>(find.byType(MacroSplitChart))
          .intake
          .proteinG,
      10,
    );
    await tester.tap(find.text('Dashboard').last);
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<MacroSplitChart>(find.byType(MacroSplitChart))
          .intake
          .proteinG,
      120,
    );
  });

  for (final collapsed in [false, true]) {
    testWidgets('Add does not toggle the meal (collapsed: $collapsed)', (
      tester,
    ) async {
      await openFood(tester, populated: true);
      final breakfast = find.byKey(const ValueKey('meal-card-breakfast'));
      await tester.ensureVisible(breakfast);
      await tester.pumpAndSettle();
      final title = find.descendant(
        of: breakfast,
        matching: find.text('Breakfast'),
      );
      if (collapsed) {
        await tester.tap(title);
        await tester.pumpAndSettle();
      }
      final add = find.descendant(
        of: breakfast,
        matching: find.byTooltip('Add food to breakfast'),
      );
      final action = find.descendant(
        of: breakfast,
        matching: find.byType(MmIconButton),
      );
      expect(tester.widget<MmIconButton>(action).kind, MmIconButtonKind.add);
      final chevron = find.descendant(
        of: breakfast,
        matching: find.byWidgetPredicate(
          (widget) =>
              widget is MmStrokeIcon && widget.kind == MmStrokeIconKind.chevron,
        ),
      );
      final chevronContext = tester.element(chevron);
      expect(tester.getSize(chevron), const Size(16, 16));
      expect(IconTheme.of(chevronContext).color, chevronContext.mm.text3);
      final plus = find.descendant(
        of: add,
        matching: find.byType(MmStrokeIcon),
      );
      expect(tester.widget<MmStrokeIcon>(plus).kind, MmStrokeIconKind.plus);
      expect(tester.getSize(plus), const Size(16, 16));
      expect(find.descendant(of: add, matching: find.text('+')), findsNothing);
      expect(tester.getSize(add).width, greaterThanOrEqualTo(48));
      await tester.tap(add);
      await tester.pumpAndSettle();
      expect(find.text('Add food'), findsWidgets);
      expect(find.byKey(const ValueKey('food-name')), findsOneWidget);
      expect(
        tester.widget<AddFoodSheet>(find.byType(AddFoodSheet)).meal,
        Meal.breakfast,
      );
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      expect(
        find.text('Food for breakfast'),
        collapsed ? findsNothing : findsOneWidget,
      );
      expect(tester.takeException(), isNull);
    });
  }
}
