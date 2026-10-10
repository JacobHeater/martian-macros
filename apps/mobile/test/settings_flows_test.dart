import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';
import 'support/confirm_initial_theme.dart';

/// MM-93: Settings flows that shipped without a test (MM-62, MM-81, MM-82).
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> openSettings(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
  }

  Future<UserSetup> setup(WidgetTester tester) async =>
      (await readNow<UserSetup?>(tester, repos.setup.loadSetup))!;

  testWidgets('switching units saves the choice', (tester) async {
    await openSettings(tester);
    expect((await setup(tester)).unitSystem, UnitSystem.imperial);
    await tester.tap(find.text('kg / cm'));
    await tester.pumpAndSettle();
    expect((await setup(tester)).unitSystem, UnitSystem.metric);
  });

  testWidgets('experience can be changed', (tester) async {
    await openSettings(tester);
    await tester.tap(find.byType(PopupMenuButton<TrainingStatus>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('3+ years').last);
    await tester.pumpAndSettle();
    expect((await setup(tester)).trainingStatus, TrainingStatus.advanced);
  });

  testWidgets('training days can be changed with the slider', (tester) async {
    await openSettings(tester);
    expect((await setup(tester)).trainingDaysPerWeek, 3);
    await tester.drag(find.byType(Slider).first, const Offset(300, 0));
    await tester.pumpAndSettle();
    expect((await setup(tester)).trainingDaysPerWeek, greaterThan(3));
  });

  testWidgets('body fat can be entered and removed', (tester) async {
    await openSettings(tester);
    expect((await setup(tester)).bodyFatPercent, isNull);
    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect((await setup(tester)).bodyFatPercent, 25);
    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect((await setup(tester)).bodyFatPercent, isNull);
  });

  testWidgets('erasing asks first; cancel keeps everything', (tester) async {
    await openSettings(tester);
    await tester.scrollUntilVisible(
      find.text('Erase all data and start over'),
      300,
    );
    await tester.drag(find.byType(ListView).first, const Offset(0, -1500));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Erase all data and start over'));
    await tester.pumpAndSettle();
    expect(find.text('Erase everything?'), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(find.text('Erase everything?'), findsNothing);
    expect(await readNow(tester, repos.setup.loadSetup), isNotNull);
  });

  testWidgets('confirming erases everything and returns to initial setup', (
    tester,
  ) async {
    await openSettings(tester);
    await tester.scrollUntilVisible(
      find.text('Erase all data and start over'),
      300,
    );
    await tester.drag(find.byType(ListView).first, const Offset(0, -1500));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Erase all data and start over'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Erase'));
    await tester.pumpAndSettle();
    expect(await readNow(tester, repos.setup.loadSetup), isNull);
    expect(
      await readNow(tester, () => repos.weights.watchWeights().first),
      isEmpty,
    );
    expect(find.text('Choose your theme'), findsOneWidget);
    await confirmInitialTheme(tester);
    expect(find.text('Get started'), findsOneWidget);
  });
}
