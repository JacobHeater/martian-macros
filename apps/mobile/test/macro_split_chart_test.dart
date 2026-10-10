import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/charts/macro_split_chart.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:mm_domain/mm_domain.dart';

void main() {
  IntakeDay intake(double p, double c, double f, {double kcal = 2000}) =>
      IntakeDay(
        date: CalendarDate(2026, 10, 10),
        kcal: kcal,
        proteinG: p,
        carbsG: c,
        fatG: f,
      );

  Future<void> pump(
    WidgetTester tester,
    IntakeDay intake, {
    bool dark = false,
  }) async {
    tester.view.physicalSize = const Size(640, 1200);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(
        theme: mmTheme(dark ? Brightness.dark : Brightness.light),
        home: Scaffold(
          body: Padding(
            padding: const EdgeInsets.all(32),
            child: MacroSplitChart(intake: intake),
          ),
        ),
      ),
    );
  }

  for (final dark in [false, true]) {
    testWidgets('energy split uses 4/4/9, labels grams and shares ($dark)', (
      tester,
    ) async {
      await pump(tester, intake(100, 150, 50), dark: dark);
      final sections = tester
          .widget<PieChart>(find.byType(PieChart))
          .data
          .sections;
      expect(sections.map((s) => s.value), [400, 600, 450]);
      expect(find.text('Protein\n100 g · 27.6%'), findsOneWidget);
      expect(find.text('Carbs\n150 g · 41.4%'), findsOneWidget);
      expect(find.text('Fat\n50 g · 31.0%'), findsOneWidget);
      expect(
        find.textContaining('1,450 kcal from recorded macros'),
        findsOneWidget,
      );
      expect(
        find.textContaining('Alcohol and other calorie differences'),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('empty macro history does not invent sectors', (tester) async {
    await pump(tester, intake(0, 0, 0, kcal: 500));
    expect(find.byType(PieChart), findsNothing);
    expect(find.textContaining('Log macro amounts'), findsOneWidget);
  });

  testWidgets('zero shares have labels but no fake sectors', (tester) async {
    await pump(tester, intake(50, 0, 0));
    final sections = tester
        .widget<PieChart>(find.byType(PieChart))
        .data
        .sections;
    expect(sections.length, 1);
    expect(sections.single.value, 200);
    expect(find.text('Protein\n50 g · 100.0%'), findsOneWidget);
    expect(find.text('Carbs\n0 g · 0.0%'), findsOneWidget);
    expect(find.text('Fat\n0 g · 0.0%'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
