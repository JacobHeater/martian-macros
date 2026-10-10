import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/app/martian_macros_app.dart';
import 'package:martian_macros/src/providers.dart';
import 'package:martian_macros/src/repository_role_providers.dart';
import 'package:martian_macros/src/theme/mm_colors.dart';
import 'package:martian_macros/src/ui/choice_card.dart';
import 'package:martian_macros/src/ui/mm_choice_chip.dart';
import 'package:martian_macros/src/ui/mm_spinner.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/confirm_initial_theme.dart';
import 'support/in_memory_overrides.dart';
import 'support/pump_app.dart';
import 'support/retry_theme_writer.dart';

void main() {
  final today = CalendarDate(2026, 10, 10);
  late InMemoryRepositories repos;
  setUp(() => repos = InMemoryRepositories());

  MmColors palette(WidgetTester tester, String label) =>
      Theme.of(tester.element(find.text(label))).extension<MmColors>()!;

  testWidgets(
    'fresh install starts in Martian, accepts it and never asks again',
    (tester) async {
      await pumpApp(tester, repos, FixedClock(today));
      expect(find.text('Get started'), findsNothing);
      expect(
        palette(tester, 'Choose your theme').canvas,
        MmColors.martian.canvas,
      );
      final choices = tester
          .widgetList<ChoiceCard>(find.byType(ChoiceCard))
          .toList();
      expect(choices.map((choice) => choice.label), [
        'Martian',
        'Light',
        'Dark',
        'System',
      ]);
      expect(choices.singleWhere((choice) => choice.selected).label, 'Martian');
      await confirmInitialTheme(tester);
      expect(
        await readNow(
          tester,
          () => repos.preferences.watchThemePreference().first,
        ),
        ThemePreference.martian,
      );
      expect(find.text('Get started'), findsOneWidget);
      expect(palette(tester, 'Get started').canvas, MmColors.martian.canvas);
      await tester.pumpWidget(const SizedBox());
      await pumpApp(tester, repos, FixedClock(today));
      expect(find.text('Choose your theme'), findsNothing);
      expect(find.text('Get started'), findsOneWidget);
      expect(palette(tester, 'Get started').canvas, MmColors.martian.canvas);
    },
  );

  testWidgets('choices preview immediately but are not saved before Continue', (
    tester,
  ) async {
    await pumpApp(tester, repos, FixedClock(today));
    for (final (label, colors) in [
      ('Light', MmColors.light),
      ('Dark', MmColors.dark),
      ('System', MmColors.light),
      ('Martian', MmColors.martian),
    ]) {
      await tester.ensureVisible(find.text(label));
      await tester.pumpAndSettle();
      await tester.tap(find.text(label));
      await tester.pumpAndSettle();
      expect(palette(tester, 'Choose your theme').canvas, colors.canvas);
      expect(
        await readNow(
          tester,
          () => repos.preferences.watchThemePreference().first,
        ),
        ThemePreference.unselected,
      );
    }
    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();
    await tester.pumpWidget(const SizedBox());
    await pumpApp(tester, repos, FixedClock(today));
    expect(
      palette(tester, 'Choose your theme').canvas,
      MmColors.martian.canvas,
    );
    await tester.tap(find.text('Light'));
    await tester.pumpAndSettle();
    await confirmInitialTheme(tester);
    expect(palette(tester, 'Get started').canvas, MmColors.light.canvas);
    expect(
      await readNow(
        tester,
        () => repos.preferences.watchThemePreference().first,
      ),
      ThemePreference.light,
    );
  });

  for (final preference in [
    ThemePreference.system,
    ThemePreference.light,
    ThemePreference.dark,
  ]) {
    testWidgets(
      'existing ${preference.name} installation skips the chooser even without setup',
      (tester) async {
        await repos.preferences.saveThemePreference(preference);
        await pumpApp(tester, repos, FixedClock(today));
        expect(find.text('Choose your theme'), findsNothing);
        expect(find.text('Get started'), findsOneWidget);
        final app = tester.widget<MaterialApp>(find.byType(MaterialApp));
        expect(app.themeMode, switch (preference) {
          ThemePreference.light => ThemeMode.light,
          ThemePreference.dark => ThemeMode.dark,
          _ => ThemeMode.system,
        });
      },
    );
  }

  testWidgets(
    'theme loading blocks onboarding and a load failure offers retry',
    (tester) async {
      final stream = StreamController<ThemePreference>();
      addTearDown(stream.close);
      var failed = false;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            ...inMemoryOverrides(repos),
            todayProvider.overrideWithValue(today),
            themePreferenceProvider.overrideWith(
              (ref) =>
                  failed ? Stream.value(ThemePreference.system) : stream.stream,
            ),
          ],
          child: const MartianMacrosApp(),
        ),
      );
      await tester.pump();
      expect(find.byType(MmSpinner), findsOneWidget);
      expect(find.text('Get started'), findsNothing);
      expect(find.text('Choose your theme'), findsNothing);
      stream.addError(Exception('theme read unavailable'));
      await tester.pumpAndSettle();
      expect(
        find.text('Could not load your theme preference.'),
        findsOneWidget,
      );
      expect(find.text('Get started'), findsNothing);
      failed = true;
      await tester.tap(find.text('Try again'));
      await tester.pumpAndSettle();
      expect(find.text('Get started'), findsOneWidget);
    },
  );

  testWidgets(
    'failed Continue keeps preview and selection, retry persists them',
    (tester) async {
      final writer = RetryThemeWriter(repos.preferences);
      await pumpApp(
        tester,
        repos,
        FixedClock(today),
        overrides: [preferencesWriterProvider.overrideWithValue(writer)],
      );
      await tester.tap(find.text('Dark'));
      await tester.pumpAndSettle();
      await confirmInitialTheme(tester);
      expect(tester.takeException(), isException);
      expect(
        find.text('Could not save your theme. Please try again.'),
        findsOneWidget,
      );
      expect(find.text('Get started'), findsNothing);
      expect(palette(tester, 'Choose your theme').canvas, MmColors.dark.canvas);
      expect(
        await readNow(
          tester,
          () => repos.preferences.watchThemePreference().first,
        ),
        ThemePreference.unselected,
      );
      writer.fail = false;
      await confirmInitialTheme(tester);
      expect(writer.calls, 2);
      expect(find.text('Get started'), findsOneWidget);
      expect(
        await readNow(
          tester,
          () => repos.preferences.watchThemePreference().first,
        ),
        ThemePreference.dark,
      );
    },
  );

  testWidgets(
    'MM-185: preview stays selected until storage emits the saved choice',
    (tester) async {
      final stream = StreamController<ThemePreference>();
      addTearDown(stream.close);
      await pumpApp(
        tester,
        repos,
        FixedClock(today),
        overrides: [
          themePreferenceProvider.overrideWith((ref) async* {
            yield ThemePreference.unselected;
            yield* stream.stream;
          }),
        ],
      );
      await tester.tap(find.text('Light'));
      await tester.pumpAndSettle();
      await confirmInitialTheme(tester);
      expect(
        palette(tester, 'Choose your theme').canvas,
        MmColors.light.canvas,
      );
      final choices = tester.widgetList<ChoiceCard>(find.byType(ChoiceCard));
      expect(choices.singleWhere((choice) => choice.selected).label, 'Light');
      stream.add(ThemePreference.light);
      await tester.pumpAndSettle();
      expect(find.text('Choose your theme'), findsNothing);
      expect(palette(tester, 'Get started').canvas, MmColors.light.canvas);
    },
  );

  testWidgets(
    'Settings offers four wrapping choices and reports failed saves',
    (tester) async {
      await repos.preferences.saveThemePreference(ThemePreference.light);
      await repos.setup.saveSetup(typicalSetup(onboardedOn: today));
      await repos.weights.saveWeight(today, 82);
      final writer = RetryThemeWriter(repos.preferences);
      await pumpApp(
        tester,
        repos,
        FixedClock(today),
        overrides: [preferencesWriterProvider.overrideWithValue(writer)],
      );
      tester.view.physicalSize = const Size(640, 1600);
      tester.view.devicePixelRatio = 2;
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      expect(
        tester
            .widgetList<MmChoiceChip>(find.byType(MmChoiceChip))
            .map((choice) => choice.label),
        ['Martian', 'Light', 'Dark', 'System'],
      );
      await tester.tap(find.text('Martian'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isException);
      expect(
        find.text('Could not save your theme. Please try again.'),
        findsOneWidget,
      );
      expect(palette(tester, 'Appearance').canvas, MmColors.light.canvas);
      writer.fail = false;
      await tester.tap(find.text('Martian'));
      await tester.pumpAndSettle();
      expect(palette(tester, 'Appearance').canvas, MmColors.martian.canvas);
      expect(
        await readNow(
          tester,
          () => repos.preferences.watchThemePreference().first,
        ),
        ThemePreference.martian,
      );
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      await pumpApp(tester, repos, FixedClock(today));
      expect(palette(tester, 'Add food').canvas, MmColors.martian.canvas);
    },
  );
}
