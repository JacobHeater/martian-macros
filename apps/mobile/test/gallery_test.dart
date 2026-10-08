import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/gallery/gallery_screen.dart';
import 'package:martian_macros/src/providers.dart';
import 'package:martian_macros/src/settings/settings_screen.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  Future<void> pump(
    WidgetTester tester,
    Widget home, {
    Brightness brightness = Brightness.light,
    String env = 'dev',
  }) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.5;
    addTearDown(tester.view.reset);
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup());
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          appEnvProvider.overrideWithValue(env),
        ],
        child: MaterialApp(theme: mmTheme(brightness), home: home),
      ),
    );
    await tester.pumpAndSettle();
  }

  group('the gallery', () {
    for (final brightness in Brightness.values) {
      testWidgets('shows every section in ${brightness.name} without errors', (
        tester,
      ) async {
        await pump(tester, const GalleryScreen(), brightness: brightness);
        for (final title in [
          'Colors',
          'Type',
          'Buttons',
          'Inputs',
          'Surfaces and rows',
          'Data and progress',
        ]) {
          await tester.scrollUntilVisible(
            find.text(title),
            400,
            scrollable: find.byType(Scrollable).first,
          );
          expect(find.text(title), findsOneWidget);
        }
        expect(tester.takeException(), isNull);
      });
    }

    testWidgets('switches theme and text size without errors', (tester) async {
      await pump(tester, const GalleryScreen());
      await tester.tap(find.text('Light'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('200%'));
      await tester.pumpAndSettle();
      expect(find.text('Component gallery'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });

  group('reaching the gallery', () {
    testWidgets('Settings offers it in development', (tester) async {
      await pump(tester, const SettingsScreen());
      await tester.scrollUntilVisible(
        find.textContaining('Martian Macros ·'),
        300,
      );
      expect(find.text('Component gallery'), findsOneWidget);
    });

    testWidgets('Settings hides it in production', (tester) async {
      await pump(tester, const SettingsScreen(), env: 'prod');
      await tester.scrollUntilVisible(
        find.textContaining('Martian Macros ·'),
        300,
      );
      expect(find.textContaining('prod'), findsOneWidget);
      expect(find.text('Component gallery'), findsNothing);
    });
  });
}
